/**
 * Health screening questionnaire processing for BloodBridge AI.
 *
 * Donors answer 8 yes/no questions during registration. Any "yes" answer,
 * age outside 18-65, or last donation within 90 days generates a flag that
 * is shown ONLY to hospital staff — never to the donor themselves.
 */

const SCREENING_QUESTIONS = [
  { key: 'fever', question: 'Do you currently have a fever, infection, or feel unwell?' },
  { key: 'hiv', question: 'Have you ever tested positive for HIV, or had known high-risk exposure?' },
  { key: 'hepatitis', question: 'Have you ever tested positive for Hepatitis B (HBsAg) or Hepatitis C?' },
  { key: 'chronic', question: 'Do you have a chronic condition (heart disease, kidney disease, or uncontrolled diabetes)?' },
  { key: 'medication', question: 'Are you currently on long-term medication (e.g. blood thinners)?' },
  { key: 'recentProcedure', question: 'Tattoo, piercing, or major dental work in the last 6 months?' },
  { key: 'pregnancy', question: 'Currently pregnant, or given birth in the last 6 months?' },
  { key: 'malariaTravel', question: 'Travelled to a malaria-affected area in the last 3 months?' },
];

const FLAG_LABELS = {
  fever: 'Reported fever/infection',
  hiv: 'Reported HIV positive or high-risk exposure',
  hepatitis: 'Reported Hepatitis B/C positive',
  chronic: 'Reported chronic condition',
  medication: 'On long-term medication',
  recentProcedure: 'Tattoo/piercing/major dental work in last 6 months',
  pregnancy: 'Currently pregnant or gave birth in last 6 months',
  malariaTravel: 'Travelled to malaria-affected area in last 3 months',
};

/**
 * Validate health screening answers. Returns { errors, screening }.
 */
function validateHealthScreening(body = {}) {
  const errors = [];
  const screening = {};

  for (const q of SCREENING_QUESTIONS) {
    const val = body[q.key];
    if (val === undefined || val === null) {
      // Allow missing answers — default to false (no flag)
      screening[q.key] = false;
    } else if (typeof val === 'boolean') {
      screening[q.key] = val;
    } else if (val === 'yes' || val === 'true' || val === 1) {
      screening[q.key] = true;
    } else if (val === 'no' || val === 'false' || val === 0) {
      screening[q.key] = false;
    } else {
      errors.push(`Health screening "${q.key}" must be yes/no.`);
    }
  }

  return { errors, screening };
}

/**
 * Compute health flags from a donor record. Returns an array of flag strings.
 * These are STAFF-ONLY — never expose to the donor.
 */
function computeHealthFlags(donor) {
  const flags = [];

  // Health screening flags
  if (donor.healthScreening) {
    for (const [key, val] of Object.entries(donor.healthScreening)) {
      if (val && FLAG_LABELS[key]) {
        flags.push(FLAG_LABELS[key]);
      }
    }
  }

  // Age flag
  if (donor.age !== undefined && donor.age !== null) {
    const age = Number(donor.age);
    if (Number.isFinite(age) && (age < 18 || age > 65)) {
      flags.push(`Age ${age} — outside recommended 18-65 range`);
    }
  }

  // 90-day donation gap flag (softer than the hard eligibility filter)
  if (donor.lastDonationDate) {
    const daysSince = Math.floor((Date.now() - new Date(donor.lastDonationDate).getTime()) / 86400000);
    if (Number.isFinite(daysSince) && daysSince < 90) {
      flags.push(`Donated ${daysSince} days ago — may not yet be eligible`);
    }
  }

  return flags;
}

module.exports = { SCREENING_QUESTIONS, validateHealthScreening, computeHealthFlags };
