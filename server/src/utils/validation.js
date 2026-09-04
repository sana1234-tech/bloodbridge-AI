/**
 * Input validation and PII masking helpers.
 * Validation stops malformed or malicious payloads at the API boundary;
 * masking keeps patient names and donor phone numbers out of public responses.
 */

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const URGENCY_LEVELS = ['critical', 'high', 'medium'];
const GENDERS = ['male', 'female', 'other'];
// Pakistani mobile formats: 03XXXXXXXXX, 03XX-XXXXXXX, +923XXXXXXXXX
const PHONE_REGEX = /^(\+?92|0)?[\s-]?3\d{2}[\s-]?\d{7}$/;

function str(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function validateBloodRequest(body = {}) {
  const errors = [];
  const patientName = str(body.patientName);
  const bloodGroup = str(body.bloodGroup);
  const urgencyLevel = str(body.urgencyLevel);
  const contactNumber = str(body.contactNumber);
  const notes = str(body.notes);
  const unitsNeeded = Number(body.unitsNeeded);

  if (patientName.length < 2 || patientName.length > 100) errors.push('Patient name must be 2-100 characters.');
  if (!BLOOD_GROUPS.includes(bloodGroup)) errors.push(`Blood group must be one of: ${BLOOD_GROUPS.join(', ')}.`);
  if (!Number.isInteger(unitsNeeded) || unitsNeeded < 1 || unitsNeeded > 20) errors.push('Units needed must be a whole number between 1 and 20.');
  if (!URGENCY_LEVELS.includes(urgencyLevel)) errors.push('Urgency level must be critical, high, or medium.');
  if (contactNumber && !PHONE_REGEX.test(contactNumber)) errors.push('Contact number must be a valid Pakistani mobile number (e.g. 0300-1234567).');
  if (notes.length > 500) errors.push('Notes must be 500 characters or fewer.');
  if (!str(body.hospitalId)) errors.push('Hospital is required.');

  return {
    errors,
    sanitized: errors.length ? null : {
      patientName,
      bloodGroup,
      unitsNeeded,
      urgencyLevel,
      contactNumber,
      notes,
      hospitalId: str(body.hospitalId),
    },
  };
}

function validateDonor(body = {}) {
  const errors = [];
  const name = str(body.name);
  const bloodGroup = str(body.bloodGroup);
  const phone = str(body.phone);
  const city = str(body.city);
  const area = str(body.area);
  const gender = str(body.gender) || 'male';
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  const lastDonationDate = str(body.lastDonationDate);

  if (name.length < 2 || name.length > 100) errors.push('Name must be 2-100 characters.');
  if (!BLOOD_GROUPS.includes(bloodGroup)) errors.push(`Blood group must be one of: ${BLOOD_GROUPS.join(', ')}.`);
  if (!PHONE_REGEX.test(phone)) errors.push('Phone must be a valid Pakistani mobile number (e.g. 0300-1234567).');
  if (!city) errors.push('City is required.');
  if (!area) errors.push('Area is required.');
  if (!GENDERS.includes(gender)) errors.push('Gender must be male, female, or other.');
  if (body.lat === undefined || body.lat === null || Number.isNaN(lat) || lat < -90 || lat > 90) {
    errors.push('Latitude must be a number between -90 and 90.');
  }
  if (body.lng === undefined || body.lng === null || Number.isNaN(lng) || lng < -180 || lng > 180) {
    errors.push('Longitude must be a number between -180 and 180.');
  }
  if (lastDonationDate && Number.isNaN(new Date(lastDonationDate).getTime())) errors.push('Last donation date must be a valid date.');

  return {
    errors,
    sanitized: errors.length ? null : {
      name,
      bloodGroup,
      phone,
      city,
      area,
      gender,
      lat,
      lng,
      lastDonationDate: lastDonationDate ? new Date(lastDonationDate) : null,
      isAvailable: body.isAvailable === undefined ? true : Boolean(body.isAvailable),
    },
  };
}

/** Mask a patient name for public lists: "Ahmad Khan" -> "A*** K***" */
function maskName(name) {
  return str(name).split(/\s+/).filter(Boolean).map(w => `${w[0]}***`).join(' ');
}

/** Mask a phone number for public lists: "03351234567" -> "0335*******" */
function maskPhone(phone) {
  const p = str(phone);
  return p ? `${p.slice(0, 4)}*******` : '';
}

module.exports = {
  BLOOD_GROUPS,
  PHONE_REGEX,
  validateBloodRequest,
  validateDonor,
  maskName,
  maskPhone,
};
