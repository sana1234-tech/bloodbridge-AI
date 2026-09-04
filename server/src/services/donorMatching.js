const db = require('../store');
const { donorEligibility, requiredGapDays } = require('./eligibility');

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

    const distance = haversineDistance(hospital.lat, hospital.lng, donor.lat, donor.lng);
    const distanceScore = Math.max(0, 1 - distance / 50);

    const daysSinceDonation = donor.lastDonationDate
      ? Math.floor((Date.now() - new Date(donor.lastDonationDate)) / (86400000))
      : 999;
    const gap = requiredGapDays(donor.gender);
    const daysPastWindow = daysSinceDonation === 999 ? null : daysSinceDonation - gap;
    // Donors who recently became eligible are most engaged; long-inactive
    // donors may have moved away or lost interest, so they score slightly lower.
    const availabilityScore = daysPastWindow === null
      ? 0.75
      : daysPastWindow <= 60 ? 1.0 : daysPastWindow <= 120 ? 0.85 : 0.7;

    const ratingScore = donor.rating / 5.0;

    let score = bloodScore * 0.4 + distanceScore * 0.3 + availabilityScore * 0.2 + ratingScore * 0.1;

    if (request.urgencyLevel === 'critical') {
      score = score * 0.7 + distanceScore * 0.3;
    }

    const etaMinutes = Math.round((distance / 30) * 60);

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
      rating: donor.rating,
      isExactMatch,
      lastDonationDays: daysSinceDonation,
      totalDonations: donor.totalDonations,
    };
  });

  scored.sort((a, b) => b.matchScore - a.matchScore);
  const topMatches = scored.slice(0, 10);
  // Update request
  const reqIdx = db.bloodRequests.data.findIndex(r => r._id === requestId);
  if (reqIdx !== -1) {
    db.bloodRequests.data[reqIdx].status = 'matched';
    db.bloodRequests.data[reqIdx].matchedDonors = topMatches.map(m => ({
      donorId: m.donorId,
      matchScore: m.matchScore,
      distance: m.distance,
    }));
  }

  return {
    request: {
      id: request._id,
      patientName: request.patientName,
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
