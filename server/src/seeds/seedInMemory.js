const db = require('../store');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { HOSPITALS_DATA } = require('../hospitalDirectory');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Synthetic demo donors are treated as having completed pre-screening.
const CLEAN_SCREENING = {
  fever: false, hiv: false, hepatitis: false, chronic: false,
  medication: false, recentProcedure: false, pregnancy: false, malariaTravel: false,
};

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

function rand(min, max) { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
function pick(arr) { return arr[randInt(0, arr.length - 1)]; }
function randomPhone() { return `03${randInt(10, 99)}${randInt(1000000, 9999999)}`; }
function randomCoord(center, spread = 0.05) { return center + rand(-spread, spread); }

function emptyInventory() {
  return Object.fromEntries(BLOOD_GROUPS.map(bg => [bg, 0]));
}

function generateInventory() {
  const inv = {};
  BLOOD_GROUPS.forEach(bg => { inv[bg] = randInt(5, 80); });
  return inv;
}

/**
 * Seed the verified 19-facility public directory.
 * Inventory starts empty in production and is filled only for local demos.
 */
function seedHospitals({ demoInventory = false } = {}) {
  HOSPITALS_DATA.forEach((h, i) => {
    const id = `h${String(i + 1).padStart(3, '0')}`;
    if (db.hospitals.data.some(existing => existing._id === id)) return;

    db.hospitals.data.push({
      _id: id,
      ...h,
      bloodInventory: demoInventory ? generateInventory() : emptyInventory(),
      inventoryUpdatedAt: demoInventory ? new Date() : null,
      createdAt: new Date(),
    });
  });
}

/** Optional synthetic donors + demand history for local demos only. */
function seedDemoData() {
  const cityNames = Object.keys(CITIES);

  if (db.donors.data.length === 0) {
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
        age: randInt(18, 60),
        city,
        area,
        lat: randomCoord(cityData.center[0]),
        lng: randomCoord(cityData.center[1]),
        lastDonationDate: lastDonation,
        isAvailable: Math.random() > 0.2,
        rating: parseFloat(rand(3.0, 5.0).toFixed(1)),
        totalDonations: randInt(0, 15),
        healthScreening: { ...CLEAN_SCREENING },
        source: 'seed',
        createdAt: registeredAt,
      });
    }
  }

  // Demo inventory only exists to make local screenshots/demos useful. It is
  // never seeded on a production deployment unless SEED_DEMO_DATA=true.
  db.hospitals.data.forEach(h => {
    if (!h.bloodInventory || Object.values(h.bloodInventory).every(v => !v)) {
      h.bloodInventory = generateInventory();
      h.inventoryUpdatedAt = new Date();
    }
  });

  if (db.demandRecords.data.length === 0) {
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
  }
}

/** Seed the default admin account so the system has someone who can approve staff. */
function seedAdmin() {
  if (db.users.data.length > 0) return;

  const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
  const configuredPassword = process.env.ADMIN_PASSWORD;

  let adminPassword = configuredPassword;
  if (!adminPassword) {
    if (isProduction) {
      // Never ship a known default password in production. A random password
      // is generated for this cold start; set ADMIN_PASSWORD to pin it.
      adminPassword = crypto.randomBytes(18).toString('base64url');
      console.warn('[security] ADMIN_PASSWORD is not set.');
      console.warn(`[security] Generated one-time admin password for 03000000001: ${adminPassword}`);
      console.warn('[security] Set ADMIN_PASSWORD in your environment to control this.');
    } else {
      adminPassword = 'admin123';
    }
  }

  const hashedPassword = bcrypt.hashSync(adminPassword, 10);
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
  console.log(`Seeded admin account: phone=03000000001${configuredPassword ? ' (password from ADMIN_PASSWORD)' : ''}`);
}

/**
 * Demo donors/demand are opt-in in production. Local development keeps them
 * so the matching, analytics and screenshots still work out of the box.
 */
function shouldSeedDemoData() {
  const flag = String(process.env.SEED_DEMO_DATA || '').trim().toLowerCase();
  if (flag === 'true' || flag === '1' || flag === 'yes') return true;
  if (flag === 'false' || flag === '0' || flag === 'no') return false;
  return process.env.NODE_ENV !== 'production' && !process.env.VERCEL;
}

function seedData({ includeDemo = true } = {}) {
  seedHospitals({ demoInventory: includeDemo });
  if (includeDemo) seedDemoData();
  seedAdmin();

  console.log(
    `Seeded: ${db.donors.data.length} donors, ${db.hospitals.data.length} hospitals, `
    + `${db.demandRecords.data.length} demand records`
  );
}

module.exports = {
  seedData,
  seedHospitals,
  seedDemoData,
  seedAdmin,
  shouldSeedDemoData,
  BLOOD_GROUPS,
};
