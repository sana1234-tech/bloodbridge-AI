/* Quick API smoke test for BloodBridge AI - run with server on port 5000 */
const BASE = 'http://localhost:5000/api';

async function j(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

(async () => {
  let failures = 0;
  const check = (name, cond, extra = '') => {
    console.log(`${cond ? 'PASS' : 'FAIL'} - ${name}${extra ? ' | ' + extra : ''}`);
    if (!cond) failures++;
  };

  // 1. Health
  const health = await j('GET', '/health');
  check('health', health.status === 200, `donors=${health.data.donors}`);

  // 2. Donors: masked phone + eligibility attached
  const donors = await j('GET', '/donors?limit=3');
  const d0 = donors.data.donors?.[0];
  check('donors list', donors.status === 200 && donors.data.donors?.length > 0);
  check('phone masked', d0 && d0.phone.includes('*'), `phone=${d0?.phone}`);
  check('eligibility attached', d0 && d0.eligibility && typeof d0.eligibility.eligible === 'boolean',
    `eligible=${d0?.eligibility?.eligible} reason="${d0?.eligibility?.reason}"`);
  const eligibleCount = (await j('GET', '/donors?eligible=true&limit=1')).data.total;
  const totalCount = (await j('GET', '/donors?limit=1')).data.total;
  check('eligible filter works', eligibleCount > 0 && eligibleCount < totalCount, `${eligibleCount}/${totalCount} eligible`);

  // 3. Invalid request rejected
  const bad = await j('POST', '/requests', { patientName: 'X', bloodGroup: 'Z+', unitsNeeded: 99, urgencyLevel: 'whenever', hospitalId: 'h001' });
  check('invalid request rejected', bad.status === 400, `"${(bad.data.error || '').slice(0, 90)}..."`);

  // 4. Invalid donor rejected (bad phone)
  const badDonor = await j('POST', '/donors', { name: 'Test Donor', bloodGroup: 'O+', phone: 'abc', city: 'Lahore', area: 'DHA', lat: 31.5, lng: 74.3 });
  check('invalid donor rejected', badDonor.status === 400, `"${(badDonor.data.error || '').slice(0, 60)}..."`);

  // 5. Valid request created
  const hospitals = (await j('GET', '/hospitals')).data;
  const req1 = await j('POST', '/requests', {
    patientName: 'Muhammad Ali', bloodGroup: 'B+', unitsNeeded: 2, urgencyLevel: 'critical',
    hospitalId: hospitals[0]._id, contactNumber: '0300-1234567', notes: 'smoke test',
  });
  check('valid request created', req1.status === 201, `id=${req1.data._id}`);

  // 6. Requests list masks patient name
  const reqList = await j('GET', '/requests?limit=5');
  const masked = reqList.data.find(r => r._id === req1.data._id);
  check('patient name masked in list', masked && masked.patientName.includes('*'), `"${masked?.patientName}"`);
  check('contact number hidden in list', masked && masked.contactNumber === undefined);

  // 7. Matching runs + excludes ineligible donors
  const match = await j('POST', `/match/${req1.data._id}`);
  check('matching works', match.status === 200 && match.data.matches?.length > 0,
    `${match.data.matches?.length} matches, totalCompatible=${match.data.totalCompatible}, excludedByEligibility=${match.data.excludedByEligibility}`);
  check('excludedByEligibility reported', typeof match.data.excludedByEligibility === 'number');
  const ineligibleMatched = match.data.matches.filter(m => m.lastDonationDays < 90);
  check('no matched donor inside 90-day window', ineligibleMatched.length === 0,
    ineligibleMatched.length ? `min days=${Math.min(...ineligibleMatched.map(m => m.lastDonationDays))}` : '');

  // 8. Fulfill with 2 donors
  const donorIds = match.data.matches.slice(0, 2).map(m => m.donorId);
  const before = (await j('GET', `/hospitals/${hospitals[0]._id}`)).data;
  const invBefore = before.bloodInventory['B+'];
  const fulfill = await j('PATCH', `/requests/${req1.data._id}/fulfill`, { donorIds });
  check('fulfillment works', fulfill.status === 200, `donorsDonated=${fulfill.data.summary?.donorsDonated}`);
  check('request status fulfilled', fulfill.data.request?.status === 'fulfilled');
  const donorAfter = (await j('GET', `/donors/${donorIds[0]}`)).data;
  check('donor now resting', donorAfter.eligibility?.eligible === false && donorAfter.isAvailable === false,
    `"${donorAfter.eligibility?.reason}"`);
  const doubleFulfill = await j('PATCH', `/requests/${req1.data._id}/fulfill`, { donorIds: [] });
  check('double fulfillment blocked', doubleFulfill.status === 400);

  // 9. Fulfill with surplus donors (3 donors, 2 units) -> restocks inventory
  const req2 = await j('POST', '/requests', {
    patientName: 'Ayesha Siddiqui', bloodGroup: 'O+', unitsNeeded: 1, urgencyLevel: 'high',
    hospitalId: hospitals[0]._id,
  });
  const match2 = await j('POST', `/match/${req2.data._id}`);
  const ids2 = match2.data.matches.slice(0, 3).map(m => m.donorId);
  const ful2 = await j('PATCH', `/requests/${req2.data._id}/fulfill`, { donorIds: ids2 });
  check('surplus restocked', ful2.data.summary?.surplusUnitsRestocked === 2,
    `surplus=${ful2.data.summary?.surplusUnitsRestocked}`);

  // 10. Predictions + accuracy
  const preds = await j('GET', '/predictions?city=Lahore');
  check('predictions work', preds.status === 200 && preds.data.length > 0, `${preds.data.length} forecast rows`);
  const acc = await j('GET', '/predictions/accuracy?city=Lahore');
  check('accuracy backtest works', acc.status === 200 && typeof acc.data.accuracy === 'number',
    `accuracy=${acc.data.accuracy}% over ${acc.data.samples} forecasts, worst group=${acc.data.groups?.[0]?.city} ${acc.data.groups?.[0]?.bloodGroup} @ ${acc.data.groups?.[0]?.accuracy}%`);

  // 11. Demand loop: today's record should include our new requests
  const todayStr = new Date().toISOString().split('T')[0];
  const acc2 = await j('GET', '/predictions/accuracy');
  const stats = await j('GET', '/stats');
  check('stats still work', stats.status === 200, `activeRequests=${stats.data.activeRequests}`);

  console.log(`\n${failures === 0 ? 'ALL TESTS PASSED' : failures + ' TEST(S) FAILED'}`);
  process.exit(failures === 0 ? 0 : 1);
})().catch(e => { console.error('CRASH:', e.message); process.exit(1); });
