const db = require('../store');
const { donorEligibility, requiredGapDays } = require('./eligibility');
const { cityCoords } = require('../utils/geo');

// Whole-blood donors must be outside their resting window before they can be
// matched at all — 90 days for men, 120 days for women (Pakistan Blood
// Transfusion Authority guideline). This is a hard safety filter, not a score.

const COMPATIBILITY = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+'],
};

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findMatchingDonors(requestId) {
  const request = db.bloodRequests.data.find(r => r._id === requestId);
  if (!request) throw new Error('Blood request not found');

  const hospital = db.hospitals.data.find(h => h._id === request.hospitalId);
  if (!hospital) throw new Error('Hospital not found');

  const requiredBloodGroup = request.bloodGroup;

  // Find compatible donor groups
  const compatibleDonorGroups = Object.entries(COMPATIBILITY)
    .filter(([_, recipients]) => recipients.includes(requiredBloodGroup))
    .map(([group]) => group);

  // Find available, compatible donors
  const compatibleDonors = db.donors.data.filter(d =>
    compatibleDonorGroups.includes(d.bloodGroup) && d.isAvailable
  );

  // Safety first: only donors outside their mandatory resting window can be
  // matched. Recently-donated donors are excluded entirely, never just ranked lower.
  const donors = compatibleDonors.filter(d => donorEligibility(d).eligible);
  const excludedByEligibility = compatibleDonors.length - donors.length;

  const scored = donors.map(donor => {
    const isExactMatch = donor.bloodGroup === requiredBloodGroup;
    const bloodScore = isExactMatch ? 1.0 : 0.7;

    // Resolve donor coordinates: their own if valid, else their city center.
    // Donors registered without coordinates (e.g. legacy records) must never
    // be silently pushed to (0,0) — that computes a ~7,000 km distance and
    // crushes their score below the top-10 cutoff, excluding them entirely.
    const fallback = cityCoords(donor.city);
    const donorLat = Number.isFinite(donor.lat) ? donor.lat : (fallback ? fallback.lat : null);
    const donorLng = Number.isFinite(donor.lng) ? donor.lng : (fallback ? fallback.lng : null);
    let distance;
    if (donorLat !== null && donorLng !== null && Number.isFinite(hospital.lat) && Number.isFinite(hospital.lng)) {
      distance = haversineDistance(hospital.lat, hospital.lng, donorLat, donorLng);
    } else {
      // No usable coordinates on either side: assume same-city donors are
      // close (10 km) and cross-city donors are far (100 km).
      distance = donor.city === hospital.city ? 10 : 100;
    }
    const distanceScore = Math.max(0, 1 - distance / 50);

    let daysSinceDonation = null;
    if (donor.lastDonationDate) {
      const d = Math.floor((Date.now() - new Date(donor.lastDonationDate).getTime()) / 86400000);
      if (Number.isFinite(d)) daysSinceDonation = Math.max(0, d);
    }
    const gap = requiredGapDays(donor.gender);
    const daysPastWindow = daysSinceDonation === null ? null : daysSinceDonation - gap;
    // Donors who recently became eligible are most engaged; long-inactive
    // donors may have moved away or lost interest, so they score slightly lower.
    // Brand-new donors with no donation history get a neutral score.
    const availabilityScore = daysPastWindow === null
      ? 0.75
      : daysPastWindow <= 60 ? 1.0 : daysPastWindow <= 120 ? 0.85 : 0.7;

    const rating = Number.isFinite(donor.rating) ? donor.rating : 4.0;
    const ratingScore = rating / 5.0;

    let score = bloodScore * 0.4 + distanceScore * 0.3 + availabilityScore * 0.2 + ratingScore * 0.1;

    if (request.urgencyLevel === 'critical') {
      score = score * 0.7 + distanceScore * 0.3;
    }

    const etaMinutes = Math.round((distance / 30) * 60);

    // Brand-new donors (registered within 24h) get a visibility guarantee —
    // they are appended to results even when the ranked top 10 is full.
    const registeredAt = donor.createdAt ? new Date(donor.createdAt).getTime() : 0;
    const recentlyRegistered = registeredAt > 0 && (Date.now() - registeredAt) < 24 * 60 * 60 * 1000;

    return {
      donorId: donor._id,
      name: donor.name,
      bloodGroup: donor.bloodGroup,
      phone: donor.phone,
      city: donor.city,
      area: donor.area,
      matchScore: Math.round(score * 100),
      distance: parseFloat(distance.toFixed(1)),
      etaMinutes,
      rating,
      isExactMatch,
      lastDonationDays: daysSinceDonation,
      totalDonations: donor.totalDonations ?? 0,
      recentlyRegistered,
    };
  });

  scored.sort((a, b) => b.matchScore - a.matchScore);
  const topMatches = scored.slice(0, 10);

  // Visibility guarantee: any donor registered in the last 24 hours must
  // appear immediately, even if the ranked top 10 is already full — a lack
  // of donation history should never bury a newly registered donor.
  for (const m of scored.slice(10)) {
    if (topMatches.length >= 20) break;
    if (m.recentlyRegistered) topMatches.push(m);
  }

  // Update request
  const reqIdx = db.bloodRequests.data.findIndex(r => r._id === requestId);
  if (reqIdx !== -1) {
    // Never downgrade a fulfilled request back to 'matched' on re-runs.
    if (db.bloodRequests.data[reqIdx].status !== 'fulfilled') {
      db.bloodRequests.data[reqIdx].status = 'matched';
    }
    db.bloodRequests.data[reqIdx].matchedDonors = topMatches.map(m => ({
      donorId: m.donorId,
      matchScore: m.matchScore,
      distance: m.distance,
    }));
  }

  return {
    request: {
      id: request._id,
      // patientName excluded — never exposed in match results
      bloodGroup: request.bloodGroup,
      unitsNeeded: request.unitsNeeded,
      urgencyLevel: request.urgencyLevel,
      hospital: hospital.name,
      hospitalArea: hospital.area,
    },
    matches: topMatches,
    totalCompatible: scored.length,
    excludedByEligibility,
  };
}

module.exports = { findMatchingDonors, haversineDistance, COMPATIBILITY };
