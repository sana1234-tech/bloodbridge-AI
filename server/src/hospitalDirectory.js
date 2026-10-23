/**
 * Static directory of demo hospitals and blood banks.
 *
 * Every entry includes a human-readable address and a helpline number so the
 * UI can show exactly where the facility is and let users call or navigate to
 * it. `lat`/`lng` are used to build Google Maps links and (in the browser) to
 * sort the directory by distance from the user's current location.
 *
 * These are seeded demo records. Replace the addresses/numbers with verified
 * facility data before using this in a real emergency-coordination service.
 */

const HOSPITALS_DATA = [
  {
    name: 'Jinnah Hospital Lahore',
    city: 'Lahore',
    area: 'Johar Town',
    address: 'Ferozepur Road, Johar Town, Lahore',
    lat: 31.4828,
    lng: 74.2968,
    phone: '042-99231040',
    helpline: '042-99231040',
    type: 'hospital',
  },
  {
    name: 'Shaukat Khanum Memorial Hospital',
    city: 'Lahore',
    area: 'Johar Town',
    address: '7-A Block R-3, Johar Town, Lahore',
    lat: 31.4788,
    lng: 74.2755,
    phone: '042-35905000',
    helpline: '042-35905000',
    type: 'hospital',
  },
  {
    name: 'Mayo Hospital Lahore',
    city: 'Lahore',
    area: 'Anarkali',
    address: 'Hospital Road, Anarkali, Lahore',
    lat: 31.5619,
    lng: 74.3124,
    phone: '042-99210202',
    helpline: '042-99210202',
    type: 'hospital',
  },
  {
    name: 'Alkhidmat Blood Bank Lahore',
    city: 'Lahore',
    area: 'Gulberg III',
    address: 'Alkhidmat Complex, Khayaban-e-Jinnah, Gulberg III, Lahore',
    lat: 31.5163,
    lng: 74.3457,
    phone: '042-35762183',
    helpline: '042-35762183',
    type: 'blood_bank',
  },
  {
    name: 'Sundas Blood Bank Lahore',
    city: 'Lahore',
    area: 'Model Town',
    address: 'Model Town Link Road, Model Town, Lahore',
    lat: 31.5065,
    lng: 74.3264,
    phone: '042-35835221',
    helpline: '042-35835221',
    type: 'blood_bank',
  },
  {
    name: 'Jinnah Postgraduate Medical Centre',
    city: 'Karachi',
    area: 'Saddar',
    address: 'Rafiqui Shaheed Road, Saddar, Karachi',
    lat: 24.8571,
    lng: 67.0245,
    phone: '021-99201300',
    helpline: '021-99201300',
    type: 'hospital',
  },
  {
    name: 'Aga Khan University Hospital',
    city: 'Karachi',
    area: 'Stadium Road',
    address: 'Stadium Road, Karachi',
    lat: 24.8907,
    lng: 67.0755,
    phone: '021-111-911-911',
    helpline: '021-111-911-911',
    type: 'hospital',
  },
  {
    name: 'Liaquat National Hospital',
    city: 'Karachi',
    area: 'Stadium Road',
    address: 'National Stadium Road, Gulshan-e-Iqbal, Karachi',
    lat: 24.8943,
    lng: 67.0787,
    phone: '021-99258000',
    helpline: '021-99258000',
    type: 'hospital',
  },
  {
    name: 'Fatimid Foundation Blood Bank Karachi',
    city: 'Karachi',
    area: 'Gulshan-e-Iqbal',
    address: '393/2, Chandni Chowk, Gulshan-e-Iqbal, Karachi',
    lat: 24.9167,
    lng: 67.095,
    phone: '021-34980824',
    helpline: '021-34980824',
    type: 'blood_bank',
  },
  {
    name: 'Indus Hospital Blood Bank',
    city: 'Karachi',
    area: 'Korangi',
    address: 'Plot C-76, Sector 31/5, Korangi Crossing, Karachi',
    lat: 24.8394,
    lng: 67.191,
    phone: '021-111-463-874',
    helpline: '021-111-463-874',
    type: 'blood_bank',
  },
  {
    name: 'Pakistan Institute of Medical Sciences (PIMS)',
    city: 'Islamabad',
    area: 'G-8/3',
    address: 'G-8/3, Islamabad',
    lat: 33.726,
    lng: 73.068,
    phone: '051-9261161',
    helpline: '051-9261161',
    type: 'hospital',
  },
  {
    name: 'Shifa International Hospital',
    city: 'Islamabad',
    area: 'H-8/4',
    address: 'Pitras Bukhari Road, H-8/4, Islamabad',
    lat: 33.7089,
    lng: 73.0318,
    phone: '051-8464646',
    helpline: '051-8464646',
    type: 'hospital',
  },
  {
    name: 'Alkhidmat Blood Bank Islamabad',
    city: 'Islamabad',
    area: 'G-11',
    address: 'G-11 Markaz, Islamabad',
    lat: 33.7084,
    lng: 73.0084,
    phone: '051-2103214',
    helpline: '051-2103214',
    type: 'blood_bank',
  },
  {
    name: 'Holy Family Hospital',
    city: 'Rawalpindi',
    area: 'Satellite Town',
    address: 'Satellite Town, Rawalpindi',
    lat: 33.6082,
    lng: 73.0578,
    phone: '051-9290300',
    helpline: '051-9290300',
    type: 'hospital',
  },
  {
    name: 'Armed Forces Institute of Transfusion',
    city: 'Rawalpindi',
    area: 'Cantt',
    address: 'CMH Road, Rawalpindi Cantt',
    lat: 33.5938,
    lng: 73.0562,
    phone: '051-5521874',
    helpline: '051-5521874',
    type: 'blood_bank',
  },
  {
    name: 'Allied Hospital Faisalabad',
    city: 'Faisalabad',
    area: 'Peoples Colony',
    address: 'Jail Road, Peoples Colony, Faisalabad',
    lat: 31.4186,
    lng: 73.0808,
    phone: '041-9220090',
    helpline: '041-9220090',
    type: 'hospital',
  },
  {
    name: 'Faisalabad Institute of Cardiology',
    city: 'Faisalabad',
    area: 'Jinnah Colony',
    address: 'Jail Road, Faisalabad',
    lat: 31.4142,
    lng: 73.0992,
    phone: '041-9330017',
    helpline: '041-9330017',
    type: 'hospital',
  },
  {
    name: 'Nishtar Hospital Multan',
    city: 'Multan',
    area: 'Nishtar Road',
    address: 'Nishtar Road, Multan',
    lat: 30.1848,
    lng: 71.478,
    phone: '061-9200143',
    helpline: '061-9200143',
    type: 'hospital',
  },
  {
    name: 'Alkhidmat Blood Bank Multan',
    city: 'Multan',
    area: 'Gulgasht Colony',
    address: 'Gulgasht Colony, Multan',
    lat: 30.1741,
    lng: 71.5199,
    phone: '061-4542961',
    helpline: '061-4542961',
    type: 'blood_bank',
  },
];

function mapsQuery(hospital) {
  const lat = Number(hospital.lat);
  const lng = Number(hospital.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return `${lat},${lng}`;
  }
  const address = hospital.address || [hospital.area, hospital.city].filter(Boolean).join(', ');
  return encodeURIComponent(`${hospital.name}, ${address}`);
}

/** Public hospital view with clickable map links and safe fallbacks. */
function hospitalView(hospital) {
  const query = mapsQuery(hospital);
  return {
    ...hospital,
    address: hospital.address || [hospital.area, hospital.city].filter(Boolean).join(', '),
    helpline: hospital.helpline || hospital.phone,
    mapUrl: `https://www.google.com/maps/search/?api=1&query=${query}`,
    directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${query}`,
  };
}

/**
 * Backfill address/helpline on records seeded before these fields existed.
 * Matches by stable seed `_id` first, then by name + city, so user-created
 * hospitals are never modified.
 */
function enrichHospitals(hospitals) {
  let changed = false;
  HOSPITALS_DATA.forEach((seed, index) => {
    const id = `h${String(index + 1).padStart(3, '0')}`;
    const hospital = hospitals.find(h => h._id === id)
      || hospitals.find(h => h.name === seed.name && h.city === seed.city);
    if (!hospital || hospital._id === undefined) return;

    if (!hospital.address && seed.address) {
      hospital.address = seed.address;
      changed = true;
    }
    if (!hospital.helpline && (seed.helpline || seed.phone)) {
      hospital.helpline = seed.helpline || seed.phone;
      changed = true;
    }
  });
  return changed;
}

module.exports = { HOSPITALS_DATA, hospitalView, enrichHospitals };
