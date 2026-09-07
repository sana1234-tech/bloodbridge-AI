const db = require('../store');
const bcrypt = require('bcryptjs');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const CITIES = {
  Lahore: { center: [31.5204, 74.3587], areas: ['Gulberg', 'DHA', 'Model Town', 'Johar Town', 'Garden Town', 'Cantt', 'Wapda Town', 'Bahria Town'] },
  Karachi: { center: [24.8607, 67.0011], areas: ['Clifton', 'DHA', 'Gulshan-e-Iqbal', 'North Nazimabad', 'Malir', 'Saddar', 'PECHS', 'Korangi'] },
  Islamabad: { center: [33.6844, 73.0479], areas: ['F-8', 'G-11', 'E-11', 'I-8', 'F-6', 'G-9', 'Blue Area', 'DHA'] },
  Rawalpindi: { center: [33.5651, 73.0169], areas: ['Satellite Town', 'Bahria Town', 'Saddar', 'Westridge', 'Chaklala', 'Adiala Road'] },
  Faisalabad: { center: [31.4504, 73.1350], areas: ['Peoples Colony', 'Madina Town', 'Gulberg', 'Samanabad', 'Jinnah Colony', 'Civil Lines'] },
  Multan: { center: [30.1575, 71.5249], areas: ['Cantt', 'Shah Rukn-e-Alam', 'Bosan Town', 'Gulgasht Colony', 'Muzaffarabad'] },
};

const FIRST_NAMES = ['Ahmad', 'Ali', 'Hassan', 'Hussain', 'Usman', 'Bilal', 'Kamran', 'Faisal', 'Saad', 'Tariq', 'Imran', 'Naveed', 'Asad', 'Waqar', 'Junaid', 'Omar', 'Zain', 'Hamza', 'Saif', 'Nasir', 'Fahad', 'Danish', 'Adnan', 'Kashif', 'Fatima', 'Ayesha', 'Sara', 'Hira', 'Maryam', 'Zara', 'Nadia', 'Sana', 'Amna', 'Huma', 'Bushra', 'Rabia', 'Nida', 'Farah', 'Saima', 'Uzma', 'Raza', 'Shahid', 'Aslam', 'Rehan', 'Sohail', 'Irfan', 'Zahid', 'Arif', 'Nadeem', 'Tanveer', 'Yasir', 'Sajid', 'Farhan', 'Adeel', 'Shoaib', 'Talha'];
const LAST_NAMES = ['Khan', 'Ahmed', 'Ali', 'Hussain', 'Malik', 'Butt', 'Chaudhry', 'Iqbal', 'Raza', 'Siddiqui', 'Qureshi', 'Mirza', 'Sheikh', 'Ansari', 'Saeed', 'Akram', 'Rehman', 'Ashraf', 'Gill', 'Javed', 'Aslam', 'Tanveer', 'Shah', 'Yousaf'];

const HOSPITALS_DATA = [
  { name: 'Jinnah Hospital Lahore', city: 'Lahore', area: 'Johar Town', lat: 31.4828, lng: 74.2968, phone: '042-99231040', type: 'hospital' },
  { name: 'Shaukat Khanum Memorial Hospital', city: 'Lahore', area: 'Johar Town', lat: 31.4788, lng: 74.2755, phone: '042-35905000', type: 'hospital' },
  { name: 'Mayo Hospital Lahore', city: 'Lahore', area: 'Mayo Hospital Road', lat: 31.5619, lng: 74.3124, phone: '042-99210202', type: 'hospital' },
  { name: 'Alkhidmat Blood Bank Lahore', city: 'Lahore', area: 'Gulberg', lat: 31.5163, lng: 74.3457, phone: '042-35762183', type: 'blood_bank' },
  { name: 'Sundas Blood Bank Lahore', city: 'Lahore', area: 'Model Town', lat: 31.5065, lng: 74.3264, phone: '042-35835221', type: 'blood_bank' },
  { name: 'Jinnah Postgraduate Medical Centre', city: 'Karachi', area: 'Saddar', lat: 24.8571, lng: 67.0245, phone: '021-99201300', type: 'hospital' },
  { name: 'Aga Khan University Hospital', city: 'Karachi', area: 'Stadium Road', lat: 24.8907, lng: 67.0755, phone: '021-111-911-911', type: 'hospital' },
  { name: 'Liaquat National Hospital', city: 'Karachi', area: 'Stadium Road', lat: 24.8943, lng: 67.0787, phone: '021-99258000', type: 'hospital' },
  { name: 'Fatimid Foundation Blood Bank Karachi', city: 'Karachi', area: 'Gulshan-e-Iqbal', lat: 24.9167, lng: 67.0950, phone: '021-34980824', type: 'blood_bank' },
  { name: 'Indus Hospital Blood Bank', city: 'Karachi', area: 'Korangi', lat: 24.8394, lng: 67.1910, phone: '021-111-463-874', type: 'blood_bank' },
  { name: 'Pakistan Institute of Medical Sciences (PIMS)', city: 'Islamabad', area: 'G-8', lat: 33.7260, lng: 73.0680, phone: '051-9261161', type: 'hospital' },
  { name: 'Shifa International Hospital', city: 'Islamabad', area: 'H-8/4', lat: 33.7089, lng: 73.0318, phone: '051-8464646', type: 'hospital' },
  { name: 'Alkhidmat Blood Bank Islamabad', city: 'Islamabad', area: 'G-11', lat: 33.7084, lng: 73.0084, phone: '051-2103214', type: 'blood_bank' },
  { name: 'Holy Family Hospital', city: 'Rawalpindi', area: 'Satellite Town', lat: 33.6082, lng: 73.0578, phone: '051-9290300', type: 'hospital' },
  { name: 'Armed Forces Institute of Transfusion', city: 'Rawalpindi', area: 'Cantt', lat: 33.5938, lng: 73.0562, phone: '051-5521874', type: 'blood_bank' },
  { name: 'Allied Hospital Faisalabad', city: 'Faisalabad', area: 'Peoples Colony', lat: 31.4186, lng: 73.0808, phone: '041-9220090', type: 'hospital' },
  { name: 'Faisalabad Institute of Cardiology', city: 'Faisalabad', area: 'Jinnah Colony', lat: 31.4142, lng: 73.0992, phone: '041-9330017', type: 'hospital' },
  { name: 'Nishtar Hospital Multan', city: 'Multan', area: 'Nishtar Road', lat: 30.1848, lng: 71.4780, phone: '061-9200143', type: 'hospital' },
  { name: 'Alkhidmat Blood Bank Multan', city: 'Multan', area: 'Gulgasht Colony', lat: 30.1741, lng: 71.5199, phone: '061-4542961', type: 'blood_bank' },
];

function rand(min, max) { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
function pick(arr) { return arr[randInt(0, arr.length - 1)]; }
function randomPhone() { return `03${randInt(10, 99)}${randInt(1000000, 9999999)}`; }
function randomCoord(center, spread = 0.05) { return center + rand(-spread, spread); }

function generateInventory() {
  const inv = {};
  BLOOD_GROUPS.forEach(bg => { inv[bg] = randInt(5, 80); });
  return inv;
}

function seedData() {
  const cityNames = Object.keys(CITIES);

  // Seed 150 donors
  for (let i = 0; i < 150; i++) {
    const city = pick(cityNames);
    const cityData = CITIES[city];
    const area = pick(cityData.areas);
    const daysAgo = randInt(30, 400);
    const lastDonation = new Date();
    lastDonation.setDate(lastDonation.getDate() - daysAgo);

    // Backdate registration so seeded demo donors look established — only
    // genuinely new signups get the "recently registered" match visibility
    // flag (otherwise every cold-start re-seed would flag all 150 donors).
    const registeredAt = new Date();
    registeredAt.setDate(registeredAt.getDate() - randInt(20, 365));

    db.donors.data.push({
      _id: `d${String(i + 1).padStart(4, '0')}`,
      name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
      bloodGroup: pick(BLOOD_GROUPS),
      phone: randomPhone(),
      gender: Math.random() > 0.5 ? 'male' : 'female',
      city,
      area,
      lat: randomCoord(cityData.center[0]),
      lng: randomCoord(cityData.center[1]),
      lastDonationDate: lastDonation,
      isAvailable: Math.random() > 0.2,
      rating: parseFloat(rand(3.0, 5.0).toFixed(1)),
      totalDonations: randInt(0, 15),
      createdAt: registeredAt,
    });
  }

  // Seed hospitals
  HOSPITALS_DATA.forEach((h, i) => {
    db.hospitals.data.push({
      _id: `h${String(i + 1).padStart(3, '0')}`,
      ...h,
      bloodInventory: generateInventory(),
      createdAt: new Date(),
    });
  });

  // Seed demand records (90 days)
  const today = new Date();
  for (let dayOffset = 90; dayOffset >= 0; dayOffset--) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    date.setHours(0, 0, 0, 0);
    const dayOfWeek = date.getDay();
    const weekdayMul = dayOfWeek >= 1 && dayOfWeek <= 5 ? 1.2 : 0.8;

    cityNames.forEach(city => {
      const cityMul = city === 'Karachi' ? 1.5 : city === 'Lahore' ? 1.4 : city === 'Islamabad' ? 1.0 : 0.7;
      BLOOD_GROUPS.forEach(bg => {
        const bgMul = bg === 'O+' ? 1.6 : bg === 'B+' ? 1.4 : bg === 'A+' ? 1.2 : bg === 'AB+' ? 0.8 : bg === 'O-' ? 0.6 : 0.5;
        const baseDemand = 10 * cityMul * bgMul * weekdayMul;
        const unitsRequested = Math.max(1, Math.round(baseDemand + rand(-3, 3)));
        const unitsFulfilled = Math.min(unitsRequested, Math.round(unitsRequested * rand(0.70, 0.95)));

        db.demandRecords.data.push({
          _id: `dr${db.demandRecords.data.length}`,
          city, bloodGroup: bg, date: new Date(date), unitsRequested, unitsFulfilled,
        });
      });
    });
  }

  console.log(`Seeded: ${db.donors.data.length} donors, ${db.hospitals.data.length} hospitals, ${db.demandRecords.data.length} demand records`);

  // Seed a default admin (verified hospital staff) account so the system has
  // someone who can approve other staff from the start.
  if (db.users.data.length === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.users.data.push({
      _id: 'u_admin001',
      role: 'staff',
      verificationStatus: 'verified',
      fullName: 'Hospital Admin',
      phone: '03000000001',
      password: hashedPassword,
      institutionName: 'Jinnah Hospital Lahore',
      institutionLicenseNo: 'REG-LHR-001',
      city: 'Lahore',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('Seeded admin account: phone=03000000001 password=admin123');
  }
}

module.exports = { seedData };
