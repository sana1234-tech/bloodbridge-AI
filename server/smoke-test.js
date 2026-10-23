/* API smoke test for BloodBridge AI — run with: node server/smoke-test.js
 * The server must already be running on port 5000.
 * Uses ADMIN_PASSWORD (defaults to admin123 for local development).
 */
const jwt = require('jsonwebtoken');

const BASE = process.env.BASE_URL || 'http://localhost:5000/api';
const ADMIN_PHONE = '03000000001';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

let failures = 0;
const check = (name, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'} - ${name}${extra ? ' | ' + extra : ''}`);
  if (!cond) failures++;
};

async function j(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

const SCREENING = {
  fever: false, hiv: false, hepatitis: false, chronic: false,
  medication: false, recentProcedure: false, pregnancy: false, malariaTravel: false,
};

(async () => {
  // Unique suffixes so repeated runs do not collide on phone numbers.
  const runId = Date.now().toString().slice(-6);
  const staffPhone = `03111${runId}`;
  const donorPhone = `03222${runId}`;

  // 1. Health
  const health = await j('GET', '/health');
  check('health', health.status === 200 && health.data.status === 'ok');

  // 2. Public donor view: masked phone, no internal userId, coarse coordinates
  const donorsRes = await j('GET', '/donors?limit=3');
  const d0 = donorsRes.data.donors?.[0];
  check('donors list', donorsRes.status === 200 && donorsRes.data.donors?.length > 0);
  check('phone masked', d0 && d0.phone.includes('*'));
  check('userId hidden', d0 && d0.userId === undefined);
  check('coordinates rounded', d0 && (d0.lat === null || (String(d0.lat).split('.')[1] || '').length <= 2));

  // 3. Public stats must not leak private request fields
  const stats = await j('GET', '/stats');
  const recent = stats.data.recentRequests?.[0];
  check('stats loads', stats.status === 200);
  check('stats hides notes', !recent || recent.notes === undefined);
  check('stats hides internalReference', !recent || recent.internalReference === undefined);
  check('stats hides postedBy', !recent || recent.postedBy === undefined);

  // 4. Legacy unauthenticated donor creation is gone
  const legacyDonor = await j('POST', '/donors', { name: 'Anon', phone: '03001234567', bloodGroup: 'O+', city: 'Lahore' });
  check('public donor POST blocked', legacyDonor.status === 404 || legacyDonor.status === 401);

  // 5. Admin login
  const adminLogin = await j('POST', '/auth/login', { phone: ADMIN_PHONE, password: ADMIN_PASSWORD, role: 'staff' });
  check('admin login', adminLogin.status === 200 && Boolean(adminLogin.data.token),
    adminLogin.status !== 200 ? `status=${adminLogin.status}` : '');
  const adminToken = adminLogin.data.token;

  const me = await j('GET', '/auth/me', null, adminToken);
  check('auth/me', me.status === 200 && me.data.user?.role === 'staff');

  // 6. A token signed with the old default secret must be rejected
  if (process.env.JWT_SECRET && process.env.JWT_SECRET !== 'bloodbridge-dev-secret') {
    const forged = jwt.sign(
      { userId: 'u_admin001', role: 'staff', verificationStatus: 'verified' },
      'bloodbridge-dev-secret',
      { expiresIn: '1h' }
    );
    const forgedRes = await fetch(`${BASE}/auth/me`, { headers: { Authorization: `Bearer ${forged}` } });
    check('forged token rejected', forgedRes.status === 401);
  }

  // 7. Requests require authentication and verification
  const anonRequest = await j('POST', '/requests', {
    patientName: 'Test Patient', bloodGroup: 'O+', unitsNeeded: 2,
    hospitalId: 'x', urgencyLevel: 'high',
  });
  check('anonymous request blocked', anonRequest.status === 401);

  const hospitals = await j('GET', '/hospitals');
  const hospital = hospitals.data?.[0];
  check('hospitals load', hospitals.status === 200 && Boolean(hospital?._id));
  check(
    'all hospitals have address + helpline + map links',
    hospitals.data?.length > 0 && hospitals.data.every(h =>
      typeof h.address === 'string' && h.address.length > 5
      && typeof h.helpline === 'string' && h.helpline.length >= 7
      && h.mapUrl?.startsWith('https://www.google.com/maps/')
      && h.directionsUrl?.startsWith('https://www.google.com/maps/dir/')
    )
  );
  const hospitalDetail = hospital?._id ? await j('GET', `/hospitals/${hospital._id}`) : { status: 0, data: {} };
  check('hospital detail returns map links', hospitalDetail.status === 200 && Boolean(hospitalDetail.data.mapUrl));

  const created = await j('POST', '/requests', {
    patientName: 'Test Patient', bloodGroup: 'O+', unitsNeeded: 2,
    hospitalId: hospital?._id, urgencyLevel: 'high',
    contactNumber: '0300-1234567', notes: 'private note',
    internalReference: 'PRIVATE-REF-1',
  }, adminToken);
  check('staff can create request', created.status === 201 && created.data._id);
  const requestId = created.data._id;
  check('created request normalizes phone', created.data.contactNumber === '03001234567');

  // 8. Public request views never expose patient identity
  const publicList = await j('GET', '/requests');
  const listed = publicList.data?.find(r => r._id === requestId);
  check('public request feed hides patientName', !listed || listed.patientName === undefined);
  check('public request feed hides contactNumber', !listed || listed.contactNumber === undefined);

  const publicDetail = await j('GET', `/requests/${requestId}`);
  check('public request detail hides patientName', publicDetail.data.patientName === undefined);

  // 9. Matching: auth required, public results masked
  const anonMatch = await j('POST', `/match/${requestId}`);
  check('anonymous matching blocked', anonMatch.status === 401);

  const match = await j('POST', `/match/${requestId}`, null, adminToken);
  check('posting staff can run matching', match.status === 200 && Array.isArray(match.data.matches));

  const publicMatch = await j('GET', `/match/${requestId}`);
  const masked = publicMatch.data.matchedDonors?.[0]?.donorId;
  check('public match masks donor name', !masked || masked.name === 'Donor');
  check('public match masks donor phone', !masked || masked.phone?.includes('*'));

  // 10. A different verified staff member cannot fulfill this request
  const staffSignup = await j('POST', '/auth/signup/staff', {
    fullName: 'Test Staff', phone: staffPhone, password: 'testpass123',
    institutionName: 'Test Hospital', institutionLicenseNo: `TEST-${runId}`,
    city: 'Lahore',
  });
  check('staff signup', staffSignup.status === 201 && staffSignup.data.user?._id);

  const approve = await j('POST', `/verification/${staffSignup.data.user?._id}/approve`, {}, adminToken);
  check('admin approves staff', approve.status === 200);

  const staffLogin = await j('POST', '/auth/login', { phone: staffPhone, password: 'testpass123', role: 'staff' });
  check('approved staff login', staffLogin.status === 200 && Boolean(staffLogin.data.token));
  const staffToken = staffLogin.data.token;

  const forbiddenMatch = await j('POST', `/match/${requestId}`, null, staffToken);
  check('non-owner cannot run matching', forbiddenMatch.status === 403);

  const forbiddenFulfill = await j('PATCH', `/requests/${requestId}/fulfill`, { donorIds: [] }, staffToken);
  check('non-owner cannot fulfill request', forbiddenFulfill.status === 403);

  // 11. Donor response flow
  const donorSignup = await j('POST', '/auth/signup/donor', {
    name: 'Test Donor', phone: donorPhone, password: 'testpass123',
    bloodGroup: 'O+', age: 30, city: 'Lahore', area: 'Gulberg',
    gender: 'male', ...SCREENING,
  });
  check('donor signup (all screening answers)', donorSignup.status === 201 && Boolean(donorSignup.data.token));

  const missingScreening = await j('POST', '/auth/signup/donor', {
    name: 'No Screening', phone: `03333${runId}`, password: 'testpass123',
    bloodGroup: 'A+', age: 30, city: 'Lahore', area: 'Model Town', gender: 'male',
  });
  check('donor signup requires screening', missingScreening.status === 400);

  const respond = await j('POST', `/requests/${requestId}/respond`, {}, donorSignup.data.token);
  check('donor can respond', respond.status === 201, respond.data.error || '');

  const respondAgain = await j('POST', `/requests/${requestId}/respond`, {}, donorSignup.data.token);
  check('duplicate response blocked', respondAgain.status === 409);

  // 12. Only posting staff can read responses
  const responses = await j('GET', `/requests/${requestId}/responses`, null, adminToken);
  check('posting staff sees responses', responses.status === 200 && responses.data.length >= 1);
  check('response includes full phone', responses.data?.[0]?.donorPhone === donorPhone);

  const otherResponses = await j('GET', `/requests/${requestId}/responses`, null, staffToken);
  check('non-owner cannot read responses', otherResponses.status === 403);

  console.log(`\n${failures === 0 ? 'All checks passed.' : `${failures} check(s) failed.`}`);
  process.exit(failures === 0 ? 0 : 1);
})().catch((err) => {
  console.error('Smoke test crashed:', err);
  process.exit(1);
});
