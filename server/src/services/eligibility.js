/**
 * Donor eligibility rules aligned with Pakistan Blood Transfusion Authority
 * guidelines: whole-blood donors must rest between donations — 90 days for
 * men, 120 days for women — before they can be matched again.
 */

const GAP_DAYS = { male: 90, female: 120, other: 90 };

function requiredGapDays(gender) {
  return GAP_DAYS[gender] || GAP_DAYS.other;
}

function daysSinceLastDonation(donor) {
  if (!donor.lastDonationDate) return null;
  const days = Math.floor((Date.now() - new Date(donor.lastDonationDate).getTime()) / 86400000);
  return Number.isFinite(days) ? Math.max(0, days) : null;
}

/**
 * Returns eligibility info for a donor:
 * { eligible, reason, daysSinceLastDonation, requiredGapDays }
 */
function donorEligibility(donor) {
  const gap = requiredGapDays(donor.gender);
  const days = daysSinceLastDonation(donor);

  if (!donor.isAvailable) {
    return { eligible: false, reason: 'Donor has paused availability', daysSinceLastDonation: days, requiredGapDays: gap };
  }
  if (days === null) {
    return { eligible: true, reason: 'No recent donation on record', daysSinceLastDonation: null, requiredGapDays: gap };
  }
  if (days >= gap) {
    return { eligible: true, reason: `Donated ${days} days ago — outside the ${gap}-day resting window`, daysSinceLastDonation: days, requiredGapDays: gap };
  }
  return {
    eligible: false,
    reason: `Resting period — ${gap - days} day(s) until eligible (donated ${days} days ago, needs ${gap})`,
    daysSinceLastDonation: days,
    requiredGapDays: gap,
  };
}

module.exports = { requiredGapDays, daysSinceLastDonation, donorEligibility };
