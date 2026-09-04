const mongoose = require('mongoose');
const Donor = require('../models/Donor');
const Hospital = require('../models/Hospital');
const DemandRecord = require('../models/DemandRecord');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bloodbridge';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const CITIES = {
  Lahore: {
    center: [31.5204, 74.3587],
    areas: ['Gulberg', 'DHA', 'Model Town', 'Johar Town', 'Garden Town', 'Cantt', 'Wapda Town', 'Bahria Town'],
  },
  Karachi: {
    center: [24.8607, 67.0011],
    areas: ['Clifton', 'DHA', 'Gulshan-e-Iqbal', 'North Nazimabad', 'Malir', 'Saddar', 'PECHS', 'Korangi'],
  },
  Islamabad: {
    center: [33.6844, 73.0479],
    areas: ['F-8', 'G-11', 'E-11', 'I-8', 'F-6', 'G-9', 'Blue Area', 'DHA'],
  },
  Rawalpindi: {
    center: [33.5651, 73.0169],
    areas: ['Satellite Town', 'Bahria Town', 'Saddar', 'Westridge', 'Chaklala', 'Adiala Road'],
  },
  Faisalabad: {
    center: [31.4504, 73.1350],
    areas: ['Peoples Colony', 'Madina Town', 'Gulberg', 'Samanabad', 'Jinnah Colony', 'Civil Lines'],
  },
  Multan: {
    center: [30.1575, 71.5249],
    areas: ['Cantt', 'Shah Rukn-e-Alam', 'Bosan Town', 'Gulgasht Colony', 'Muzaffarabad'],
  },
};

const FIRST_NAMES = [
  'Ahmad', 'Ali', 'Hassan', 'Hussain', 'Usman', 'Bilal', 'Kamran', 'Faisal',
  'Saad', 'Tariq', 'Imran', 'Naveed', 'Asad', 'Waqar', 'Junaid', 'Omar',
  'Zain', 'Hamza', 'Saif', 'Nasir', 'Fahad', 'Danish', 'Adnan', 'Kashif',
  'Fatima', 'Ayesha', 'Sara', 'Hira', 'Maryam', 'Zara', 'Nadia', 'Sana',
  'Amna', 'Huma', 'Bushra', 'Rabia', 'Nida', 'Farah', 'Saima', 'Uzma',
  'Raza', 'Shahid', 'Aslam', 'Rehan', 'Sohail', 'Irfan', 'Zahid', 'Arif',
  'Nadeem', 'Tanveer', 'Yasir', 'Sajid', 'Farhan', 'Adeel', 'Shoaib', 'Talha',
];

const LAST_NAMES = [
  'Khan', 'Ahmed', 'Ali', 'Hussain', 'Malik', 'Butt', 'Chaudhry', 'Iqbal',
  'Raza', 'Siddiqui', 'Qureshi', 'Mirza', 'Sheikh', 'Ansari', 'Saeed', 'Akram',
  'Rehman', 'Ashraf', 'Gill', 'Javed', 'Aslam', 'Tanveer', 'Shah', 'Yousaf',
];

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function randomPhone() {
  return `03${randInt(10, 99)}${randInt(1000000, 9999999)}`;
}

function randomCoord(center, spread = 0.05) {
  return center + rand(-spread, spread);
}

function generateDonors(count) {
  const donors = [];
  const cityNames = Object.keys(CITIES);

  for (let i = 0; i < count; i++) {
    const city = pick(cityNames);
    const cityData = CITIES[city];
    const area = pick(cityData.areas);
    const daysSinceDonation = randInt(30, 400);
    const lastDonation = new Date();
    lastDonation.setDate(lastDonation.getDate() - daysSinceDonation);

    donors.push({
      name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
      bloodGroup: pick(BLOOD_GROUPS),
      phone: randomPhone(),
      city,
      area,
      lat: randomCoord(cityData.center[0]),
      lng: randomCoord(cityData.center[1]),
      lastDonationDate: lastDonation,
      isAvailable: Math.random() > 0.2,
      rating: parseFloat(rand(3.0, 5.0).toFixed(1)),
      totalDonations: randInt(0, 15),
    });
  }
  return donors;
}

const HOSPITALS = [
  // Lahore
  { name: 'Jinnah Hospital Lahore', city: 'Lahore', area: 'Johar Town', lat: 31.4828, lng: 74.2968, phone: '042-99231040', type: 'hospital' },
  { name: 'Shaukat Khanum Memorial Hospital', city: 'Lahore', area: 'Johar Town', lat: 31.4788, lng: 74.2755, phone: '042-35905000', type: 'hospital' },
  { name: 'Mayo Hospital Lahore', city: 'Lahore', area: 'Mayo Hospital Road', lat: 31.5619, lng: 74.3124, phone: '042-99210202', type: 'hospital' },
  { name: 'Alkhidmat Blood Bank Lahore', city: 'Lahore', area: 'Gulberg', lat: 31.5163, lng: 74.3457, phone: '042-35762183', type: 'blood_bank' },
  { name: 'Sundas Blood Bank Lahore', city: 'Lahore', area: 'Model Town', lat: 31.5065, lng: 74.3264, phone: '042-35835221', type: 'blood_bank' },
  // Karachi
  { name: 'Jinnah Postgraduate Medical Centre', city: 'Karachi', area: 'Saddar', lat: 24.8571, lng: 67.0245, phone: '021-99201300', type: 'hospital' },
  { name: 'Aga Khan University Hospital', city: 'Karachi', area: 'Stadium Road', lat: 24.8907, lng: 67.0755, phone: '021-111-911-911', type: 'hospital' },
  { name: 'Liaquat National Hospital', city: 'Karachi', area: 'Stadium Road', lat: 24.8943, lng: 67.0787, phone: '021-99258000', type: 'hospital' },
  { name: 'Fatimid Foundation Blood Bank Karachi', city: 'Karachi', area: 'Gulshan-e-Iqbal', lat: 24.9167, lng: 67.0950, phone: '021-34980824', type: 'blood_bank' },
  { name: 'Indus Hospital Blood Bank', city: 'Karachi', area: 'Korangi', lat: 24.8394, lng: 67.1910, phone: '021-111-463-874', type: 'blood_bank' },
  // Islamabad
  { name: 'Pakistan Institute of Medical Sciences (PIMS)', city: 'Islamabad', area: 'G-8', lat: 33.7260, lng: 73.0680, phone: '051-9261161', type: 'hospital' },
  { name: 'Shifa International Hospital', city: 'Islamabad', area: 'H-8/4', lat: 33.7089, lng: 73.0318, phone: '051-8464646', type: 'hospital' },
  { name: 'Alkhidmat Blood Bank Islamabad', city: 'Islamabad', area: 'G-11', lat: 33.7084, lng: 73.0084, phone: '051-2103214', type: 'blood_bank' },
  // Rawalpindi
  { name: 'Holy Family Hospital', city: 'Rawalpindi', area: 'Satellite Town', lat: 33.6082, lng: 73.0578, phone: '051-9290300', type: 'hospital' },
  { name: 'Armed Forces Institute of Transfusion', city: 'Rawalpindi', area: 'Cantt', lat: 33.5938, lng: 73.0562, phone: '051-5521874', type: 'blood_bank' },
  // Faisalabad
  { name: 'Allied Hospital Faisalabad', city: 'Faisalabad', area: 'Peoples Colony', lat: 31.4186, lng: 73.0808, phone: '041-9220090', type: 'hospital' },
  { name: 'Faisalabad Institute of Cardiology', city: 'Faisalabad', area: 'Jinnah Colony', lat: 31.4142, lng: 73.0992, phone: '041-9330017', type: 'hospital' },
  // Multan
  { name: 'Nishtar Hospital Multan', city: 'Multan', area: 'Nishtar Road', lat: 30.1848, lng: 71.4780, phone: '061-9200143', type: 'hospital' },
  { name: 'Alkhidmat Blood Bank Multan', city: 'Multan', area: 'Gulgasht Colony', lat: 30.1741, lng: 71.5199, phone: '061-4542961', type: 'blood_bank' },
];

function generateInventory() {
  const inventory = {};
  BLOOD_GROUPS.forEach(bg => {
    inventory[bg] = randInt(5, 80);
  });
  return inventory;
}

function generateDemandRecords() {
  const records = [];
  const cityNames = Object.keys(CITIES);
  const today = new Date();

  // Generate 90 days of historical data
  for (let dayOffset = 90; dayOffset >= 0; dayOffset--) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    date.setHours(0, 0, 0, 0);

    const dayOfWeek = date.getDay();
    // Weekdays have higher demand than weekends
    const weekdayMultiplier = dayOfWeek >= 1 && dayOfWeek <= 5 ? 1.2 : 0.8;

    cityNames.forEach(city => {
      // Larger cities have higher demand
      const cityMultiplier = city === 'Karachi' ? 1.5 : city === 'Lahore' ? 1.4 : city === 'Islamabad' ? 1.0 : 0.7;

      BLOOD_GROUPS.forEach(bg => {
        // O+ and B+ have highest demand in Pakistan
        const bgMultiplier = bg === 'O+' ? 1.6 : bg === 'B+' ? 1.4 : bg === 'A+' ? 1.2 : bg === 'AB+' ? 0.8 : bg === 'O-' ? 0.6 : 0.5;

        const baseDemand = 10 * cityMultiplier * bgMultiplier * weekdayMultiplier;
        const unitsRequested = Math.max(1, Math.round(baseDemand + rand(-3, 3)));
        // Fulfillment rate varies (70-95%)
        const fulfillmentRate = rand(0.70, 0.95);
        const unitsFulfilled = Math.min(unitsRequested, Math.round(unitsRequested * fulfillmentRate));

        records.push({
          city,
          bloodGroup: bg,
          date: new Date(date),
          unitsRequested,
          unitsFulfilled,
        });
      });
    });
  }
  return records;
}

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Donor.deleteMany({});
    await Hospital.deleteMany({});
    await DemandRecord.deleteMany({});
    console.log('Cleared existing data');

    // Seed donors
    const donors = generateDonors(150);
    await Donor.insertMany(donors);
    console.log(`Seeded ${donors.length} donors`);

    // Seed hospitals
    const hospitals = HOSPITALS.map(h => ({
      ...h,
      bloodInventory: generateInventory(),
    }));
    await Hospital.insertMany(hospitals);
    console.log(`Seeded ${hospitals.length} hospitals/blood banks`);

    // Seed demand records
    const demandRecords = generateDemandRecords();
    await DemandRecord.insertMany(demandRecords);
    console.log(`Seeded ${demandRecords.length} demand records`);

    console.log('Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
