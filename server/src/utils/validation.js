/**
 * Input validation and PII masking helpers.
 * Validation stops malformed or malicious payloads at the API boundary;
 * masking keeps patient names and donor phone numbers out of public responses.
 */

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const URGENCY_LEVELS = ['critical', 'high', 'medium'];
const GENDERS = ['male', 'female', 'other'];
const CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan'];
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
  const internalReference = str(body.internalReference);
  const unitsNeeded = Number(body.unitsNeeded);

  if (patientName.length < 2 || patientName.length > 100) errors.push('Patient name must be 2-100 characters.');
  if (!BLOOD_GROUPS.includes(bloodGroup)) errors.push(`Blood group must be one of: ${BLOOD_GROUPS.join(', ')}.`);
  if (!Number.isInteger(unitsNeeded) || unitsNeeded < 1 || unitsNeeded > 20) errors.push('Units needed must be a whole number between 1 and 20.');
  if (!URGENCY_LEVELS.includes(urgencyLevel)) errors.push('Urgency level must be critical, high, or medium.');
  if (contactNumber && !PHONE_REGEX.test(contactNumber)) errors.push('Contact number must be a valid Pakistani mobile number (e.g. 0300-1234567).');
  if (notes.length > 500) errors.push('Notes must be 500 characters or fewer.');
  if (!str(body.hospitalId)) errors.push('Hospital is required.');
  if (internalReference.length > 100) errors.push('Internal reference must be 100 characters or fewer.');

  return {
    errors,
    sanitized: errors.length ? null : {
      patientName,
      bloodGroup,
      unitsNeeded,
      urgencyLevel,
      contactNumber,
      notes,
      internalReference,
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
  const age = body.age !== undefined ? Number(body.age) : null;
  const lastDonationDate = str(body.lastDonationDate);

  if (name.length < 2 || name.length > 100) errors.push('Name must be 2-100 characters.');
  if (!BLOOD_GROUPS.includes(bloodGroup)) errors.push(`Blood group must be one of: ${BLOOD_GROUPS.join(', ')}.`);
  if (!PHONE_REGEX.test(phone)) errors.push('Phone must be a valid Pakistani mobile number (e.g. 0300-1234567).');
  if (!city) errors.push('City is required.');
  if (!GENDERS.includes(gender)) errors.push('Gender must be male, female, or other.');
  // lat/lng are optional now (auto-generated for replacement donors)
  if (body.lat !== undefined && body.lat !== null && (Number.isNaN(lat) || lat < -90 || lat > 90)) {
    errors.push('Latitude must be a number between -90 and 90.');
  }
  if (body.lng !== undefined && body.lng !== null && (Number.isNaN(lng) || lng < -180 || lng > 180)) {
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
      area: area || city,
      gender,
      age: age && Number.isFinite(age) ? age : null,
      lat: Number.isFinite(lat) ? lat : null,
      lng: Number.isFinite(lng) ? lng : null,
      lastDonationDate: lastDonationDate ? new Date(lastDonationDate) : null,
      isAvailable: body.isAvailable === undefined ? true : Boolean(body.isAvailable),
    },
  };
}

/** Validate staff (hospital/blood bank) signup */
function validateStaffSignup(body = {}) {
  const errors = [];
  const fullName = str(body.fullName);
  const phone = str(body.phone);
  const password = str(body.password);
  const institutionName = str(body.institutionName);
  const institutionLicenseNo = str(body.institutionLicenseNo);
  const city = str(body.city);

  if (fullName.length < 2 || fullName.length > 100) errors.push('Full name must be 2-100 characters.');
  if (!PHONE_REGEX.test(phone)) errors.push('Phone must be a valid Pakistani mobile number.');
  if (password.length < 4) errors.push('Password must be at least 4 characters.');
  if (institutionName.length < 2) errors.push('Institution name is required.');
  if (institutionLicenseNo.length < 2) errors.push('Institution registration/license number is required.');
  if (!city) errors.push('City is required.');

  return {
    errors,
    sanitized: errors.length ? null : { fullName, phone, password, institutionName, institutionLicenseNo, city },
  };
}

/** Validate donor signup (basic fields only; health screening validated separately) */
function validateDonorSignup(body = {}) {
  const errors = [];
  const name = str(body.name);
  const phone = str(body.phone);
  const password = str(body.password);
  const bloodGroup = str(body.bloodGroup);
  const age = body.age !== undefined ? Number(body.age) : null;
  const city = str(body.city);
  const area = str(body.area);
  const gender = str(body.gender) || 'male';
  const lastDonationDate = str(body.lastDonationDate);

  if (name.length < 2 || name.length > 100) errors.push('Name must be 2-100 characters.');
  if (!PHONE_REGEX.test(phone)) errors.push('Phone must be a valid Pakistani mobile number.');
  if (password.length < 4) errors.push('Password must be at least 4 characters.');
  if (!BLOOD_GROUPS.includes(bloodGroup)) errors.push(`Blood group must be one of: ${BLOOD_GROUPS.join(', ')}.`);
  if (age !== null && (!Number.isFinite(age) || age < 1 || age > 120)) errors.push('Age must be a valid number.');
  if (!city) errors.push('City is required.');
  if (!GENDERS.includes(gender)) errors.push('Gender must be male, female, or other.');
  if (lastDonationDate && Number.isNaN(new Date(lastDonationDate).getTime())) errors.push('Last donation date must be a valid date.');

  return {
    errors,
    sanitized: errors.length ? null : {
      name, phone, password, bloodGroup, age,
      city, area: area || city, gender,
      lastDonationDate: lastDonationDate ? new Date(lastDonationDate) : null,
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
  CITIES,
  validateBloodRequest,
  validateDonor,
  validateStaffSignup,
  validateDonorSignup,
  maskName,
  maskPhone,
};
