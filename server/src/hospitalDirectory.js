/**
 * Public directory of hospitals and blood banks.
 *
 * Addresses and helplines are taken from official hospital / NGO contact pages
 * and Punjab Blood Transfusion Authority listings. `lat`/`lng` are used only
 * for nearest-first sorting; Google Maps links use the facility name plus the
 * full street address so the pin always resolves to the real place.
 */

const HOSPITALS_DATA = [
  {
    name: 'Jinnah Hospital Lahore',
    city: 'Lahore',
    area: 'Faisal Town',
    address: 'Allama Shabbir Ahmed Usmani Road, Faisal Town, Lahore 54550',
    lat: 31.4828,
    lng: 74.298,
    phone: '042-99231480',
    helpline: '042-99231400',
    type: 'hospital',
  },
  {
    name: 'Shaukat Khanum Memorial Cancer Hospital & Research Centre',
    city: 'Lahore',
    area: 'Johar Town',
    address: '7-A Block R-3, M.A. Johar Town, Lahore 54000',
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
    address: 'Hospital Road, Anarkali Bazaar, Lahore 54000',
    lat: 31.5619,
    lng: 74.3124,
    phone: '042-99211127',
    helpline: '042-99211127',
    type: 'hospital',
  },
  {
    name: 'Alkhidmat Foundation Blood Bank Lahore',
    city: 'Lahore',
    area: 'Khayaban-e-Jinnah',
    address: 'Alkhidmat Complex, 3 km Khayaban-e-Jinnah, next to Water Filtration Plant, Dream Villas, Lahore 54000',
    lat: 31.468,
    lng: 74.4055,
    phone: '042-38020222',
    helpline: '0800-44448',
    type: 'blood_bank',
  },
  {
    name: 'Sundas Foundation Blood Bank Lahore',
    city: 'Lahore',
    area: 'Shadman',
    address: '880 Shadman-1, near Crescent Girls School, Lahore',
    lat: 31.5343,
    lng: 74.3303,
    phone: '042-37422131',
    helpline: '042-111-786-327',
    type: 'blood_bank',
  },
  {
    name: 'Jinnah Postgraduate Medical Centre (JPMC)',
    city: 'Karachi',
    area: 'Saddar',
    address: 'Rafiqui Shaheed Road, Karachi 75510',
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
    address: 'Stadium Road, P.O. Box 3500, Karachi 74800',
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
    address: 'Stadium Road, Karachi 74800',
    lat: 24.8931,
    lng: 67.0684,
    phone: '021-111-456-456',
    helpline: '021-111-456-456',
    type: 'hospital',
  },
  {
    name: 'Fatimid Foundation Blood Bank Karachi',
    city: 'Karachi',
    area: 'Garden East',
    address: '393 Britto Road, Garden East, Karachi 74800',
    lat: 24.8816,
    lng: 67.0336,
    phone: '021-32225284',
    helpline: '021-32225284',
    type: 'blood_bank',
  },
  {
    name: 'Indus Hospital & Health Network Blood Bank',
    city: 'Karachi',
    area: 'Korangi',
    address: 'Plot C-76, Sector 31/5, opposite Darussalam Society, Korangi Crossing, Karachi 75190',
    lat: 24.8394,
    lng: 67.191,
    phone: '021-35112709',
    helpline: '021-35112206',
    type: 'blood_bank',
  },
  {
    name: 'Pakistan Institute of Medical Sciences (PIMS)',
    city: 'Islamabad',
    area: 'G-8/3',
    address: 'Ibn-e-Sina Road, G-8/3, Islamabad',
    lat: 33.726,
    lng: 73.068,
    phone: '051-9261170',
    helpline: '051-9261170',
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
    name: 'Al-Khidmat Raazi Hospital Blood Bank',
    city: 'Islamabad',
    area: 'CBR Town',
    address: 'Street 37, CBR Town Phase I Block C, Islamabad',
    lat: 33.5573,
    lng: 73.1409,
    phone: '051-2374911',
    helpline: '051-2374911',
    type: 'blood_bank',
  },
  {
    name: 'Holy Family Hospital',
    city: 'Rawalpindi',
    area: 'Satellite Town',
    address: 'Holy Family Road, Block F, Satellite Town, Rawalpindi',
    lat: 33.6082,
    lng: 73.0578,
    phone: '051-9290322',
    helpline: '051-9290321',
    type: 'hospital',
  },
  {
    name: 'Armed Forces Institute of Transfusion (AFIT)',
    city: 'Rawalpindi',
    area: 'Cantt',
    address: 'Sher Khan Road, Rawalpindi 46000',
    lat: 33.5982,
    lng: 73.0372,
    phone: '051-111-222-900',
    helpline: '051-111-222-900',
    type: 'blood_bank',
  },
  {
    name: 'Allied Hospital Faisalabad',
    city: 'Faisalabad',
    area: 'Jail Road',
    address: 'Jail Road, near Sargodha Road, Faisalabad',
    lat: 31.4491,
    lng: 73.0808,
    phone: '041-9210095',
    helpline: '041-9210095',
    type: 'hospital',
  },
  {
    name: 'Faisalabad Institute of Cardiology',
    city: 'Faisalabad',
    area: 'Civil Lines',
    address: 'Club Road, opposite Chenab Club, Faisalabad',
    lat: 31.4227,
    lng: 73.0866,
    phone: '041-9201529',
    helpline: '041-9201529',
    type: 'hospital',
  },
  {
    name: 'Nishtar Hospital Multan',
    city: 'Multan',
    area: 'Nishtar Road',
    address: 'Nishtar Road, Multan',
    lat: 30.2026,
    lng: 71.4435,
    phone: '061-9200238',
    helpline: '061-9200238',
    type: 'hospital',
  },
  {
    name: 'Fatimid Foundation Blood Bank Multan',
    city: 'Multan',
    area: 'Shah Rukn-e-Alam Colony',
    address: 'J-26, T Chowk, Shah Rukn-e-Alam Colony, Multan',
    lat: 30.1923,
    lng: 71.5033,
    phone: '061-4554520',
    helpline: '061-4554520',
    type: 'blood_bank',
  },
];

/**
 * Build a Google Maps query from the facility name and street address.
 * Coordinates are deliberately not used: a name+address search resolves to
 * the actual Google Maps place, while a stale pin can point to the wrong gate.
 */
function mapsQuery(hospital) {
  const address = hospital.address || [hospital.area, hospital.city].filter(Boolean).join(', ');
  const label = [hospital.name, address].filter(Boolean).join(', ');
  if (label) return encodeURIComponent(label);

  const lat = Number(hospital.lat);
  const lng = Number(hospital.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) return `${lat},${lng}`;
  return '';
}

/** Public hospital view with clickable Google Maps links and safe fallbacks. */
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
 * Backfill and correct the seeded 19-facility directory on older snapshots.
 * Matches by stable seed `_id` only, so user-created hospitals are never
 * modified. Overwrites stale demo addresses, phone numbers and coordinates.
 */
function enrichHospitals(hospitals) {
  let changed = false;
  HOSPITALS_DATA.forEach((seed, index) => {
    const id = `h${String(index + 1).padStart(3, '0')}`;
    const hospital = hospitals.find(h => h._id === id);
    if (!hospital) return;

    Object.entries(seed).forEach(([field, value]) => {
      if (hospital[field] !== value) {
        hospital[field] = value;
        changed = true;
      }
    });
  });
  return changed;
}

module.exports = { HOSPITALS_DATA, hospitalView, enrichHospitals };
