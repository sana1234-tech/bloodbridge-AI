/**
 * Data store for BloodBridge AI.
 *
 * Two modes:
 *   1. MongoDB (when MONGO_URI is set) — durable storage for production.
 *      Documents are loaded into memory on startup for fast synchronous reads
 *      (the route handlers use a simple `db.<collection>.data` interface), and
 *      changes are diffed + upserted back to MongoDB after each mutation.
 *   2. JSON file (no MONGO_URI) — local/demo fallback. Data is persisted to
 *      server/data/bloodbridge-data.json. On serverless hosts the filesystem
 *      is read-only, so use MongoDB for a deployed instance.
 *
 * The in-memory cache keeps the existing synchronous code simple while MongoDB
 * provides durability and sharing between instances/cold starts.
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

class Collection {
  constructor(name) {
    this.name = name;
    this.data = [];
    this._idCounter = 1;
  }

  _generateId() {
    return `${Date.now().toString(36)}${(this._idCounter++).toString(36).padStart(4, '0')}${Math.random().toString(36).slice(2, 6)}`;
  }

  _matchQuery(doc, query) {
    for (const [key, condition] of Object.entries(query)) {
      if (key === '$or') {
        if (!condition.some(subQ => this._matchQuery(doc, subQ))) return false;
        continue;
      }

      const value = key.includes('.') ? key.split('.').reduce((o, k) => o?.[k], doc) : doc[key];

      if (condition && typeof condition === 'object' && !Array.isArray(condition)) {
        if ('$in' in condition) {
          if (!condition.$in.includes(value)) return false;
        }
        if ('$exists' in condition) {
          if (condition.$exists && value === undefined) return false;
          if (!condition.$exists && value !== undefined) return false;
        }
        if ('$gte' in condition && value < condition.$gte) return false;
        if ('$lte' in condition && value > condition.$lte) return false;
      } else {
        if (value !== condition) return false;
      }
    }
    return true;
  }

  async insertMany(docs) {
    const inserted = docs.map(doc => ({
      ...doc,
      _id: this._generateId(),
      createdAt: doc.createdAt || new Date(),
      updatedAt: new Date(),
    }));
    this.data.push(...inserted);
    return inserted;
  }

  async create(doc) {
    const inserted = {
      ...doc,
      _id: this._generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.data.push(inserted);
    return { ...inserted, toObject() { return this; } };
  }

  async find(query = {}) {
    let results = this.data.filter(doc => this._matchQuery(doc, query));
    const chain = {
      _results: results,
      populate() { return chain; },
      sort(sortObj) {
        const key = Object.keys(sortObj)[0];
        const dir = sortObj[key];
        chain._results.sort((a, b) => dir === 1
          ? (a[key] > b[key] ? 1 : -1)
          : (a[key] < b[key] ? 1 : -1));
        return chain;
      },
      skip(n) { chain._results = chain._results.slice(n); return chain; },
      limit(n) { chain._results = chain._results.slice(0, n); return chain; },
      lean() { return Promise.resolve(chain._results.map(d => ({ ...d }))); },
      then(resolve) { return resolve(chain._results); },
    };
    return chain;
  }

  async findOne(query = {}) {
    return this.data.find(doc => this._matchQuery(doc, query)) || null;
  }

  async findById(id) {
    const doc = this.data.find(d => d._id === id);
    if (!doc) return null;
    const populated = { ...doc };
    populated.populate = function() { return Promise.resolve(this); };
    populated.toObject = function() { return this; };
    return populated;
  }

  async findByIdAndUpdate(id, update, options = {}) {
    const idx = this.data.findIndex(d => d._id === id);
    if (idx === -1) return null;
    this.data[idx] = { ...this.data[idx], ...update, updatedAt: new Date() };
    return { ...this.data[idx] };
  }

  async countDocuments(query = {}) {
    return this.data.filter(doc => this._matchQuery(doc, query)).length;
  }

  async deleteMany(query = {}) {
    const before = this.data.length;
    this.data = this.data.filter(doc => !this._matchQuery(doc, query));
    return { deletedCount: before - this.data.length };
  }

  async aggregate(pipeline) {
    let results = [...this.data];

    for (const stage of pipeline) {
      if (stage.$group) {
        const grouped = {};
        const idField = stage.$group._id;

        results.forEach(doc => {
          const key = idField.startsWith('$') ? doc[idField.slice(1)] : idField;
          if (!grouped[key]) grouped[key] = { _id: key };

          Object.entries(stage.$group).forEach(([field, expr]) => {
            if (field === '_id') return;
            if (expr.$sum !== undefined) {
              if (expr.$sum === 1) {
                grouped[key][field] = (grouped[key][field] || 0) + 1;
              } else if (typeof expr.$sum === 'object' && expr.$sum.$cond) {
                const [cond, trueVal, falseVal] = expr.$sum.$cond;
                const val = doc[cond.slice(1)] ? trueVal : falseVal;
                grouped[key][field] = (grouped[key][field] || 0) + val;
              }
            }
          });
        });

        results = Object.values(grouped);
      }

      if (stage.$sort) {
        const key = Object.keys(stage.$sort)[0];
        const dir = stage.$sort[key];
        results.sort((a, b) => dir === 1 ? (a[key] > b[key] ? 1 : -1) : (a[key] < b[key] ? 1 : -1));
      }
    }

    return results;
  }
}

// Global store
const db = {
  donors: new Collection('donors'),
  hospitals: new Collection('hospitals'),
  bloodRequests: new Collection('bloodRequests'),
  demandRecords: new Collection('demandRecords'),
  users: new Collection('users'),
  donorResponses: new Collection('donorResponses'),
};

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'bloodbridge-data.json');
const MONGO_URI = process.env.MONGO_URI || '';

// On serverless/Vercel the filesystem is ephemeral, so a missing MONGO_URI
// means data will disappear on the next cold start. Keep the app usable but
// make the problem obvious in the logs.
const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
if (!MONGO_URI && isProduction) {
  console.warn('[db] MONGO_URI is not set — using the ephemeral JSON fallback.');
  console.warn('[db] Configure MongoDB Atlas for durable production storage.');
}

// Explicit collection names so the raw driver and any future Mongoose models
// share the same data. (The bundled models are currently unused.)
const MONGO_COLLECTIONS = {
  donors: 'donors',
  hospitals: 'hospitals',
  bloodRequests: 'blood_requests',
  demandRecords: 'demand_records',
  users: 'users',
  donorResponses: 'donor_responses',
};

let mongoReady = false;
let initPromise = null;
let persistChain = Promise.resolve();
let lastSynced = new Map();

function snapshot() {
  return {
    donors: db.donors.data,
    hospitals: db.hospitals.data,
    bloodRequests: db.bloodRequests.data,
    demandRecords: db.demandRecords.data,
    users: db.users.data,
    donorResponses: db.donorResponses.data,
    savedAt: new Date().toISOString(),
  };
}

// ── JSON fallback (local development) ────────────────────────────────────────

function loadJson() {
  try {
    if (!fs.existsSync(DATA_FILE)) return false;
    const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    if (!raw || !Array.isArray(raw.donors) || raw.donors.length === 0) return false;
    db.donors.data = raw.donors;
    db.hospitals.data = raw.hospitals || [];
    db.bloodRequests.data = raw.bloodRequests || [];
    db.demandRecords.data = raw.demandRecords || [];
    db.users.data = raw.users || [];
    db.donorResponses.data = raw.donorResponses || [];
    return true;
  } catch (err) {
    console.error('Failed to load persisted data:', err.message);
    return false;
  }
}

function persistJson() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(snapshot()));
    return true;
  } catch (err) {
    // On Vercel the filesystem is read-only. MongoDB should be configured
    // there; failing to write the local snapshot must not break requests.
    console.error('Failed to persist data to JSON:', err.message);
    return false;
  }
}

// ── MongoDB ──────────────────────────────────────────────────────────────────

function database() {
  return mongoose.connection.db;
}

async function ensureIndexes() {
  const indexes = [
    database().collection(MONGO_COLLECTIONS.users).createIndex({ phone: 1 }),
    database().collection(MONGO_COLLECTIONS.donors).createIndex({ phone: 1 }),
    database().collection(MONGO_COLLECTIONS.donors).createIndex({ city: 1, bloodGroup: 1, isAvailable: 1 }),
    database().collection(MONGO_COLLECTIONS.hospitals).createIndex({ city: 1 }),
    database().collection(MONGO_COLLECTIONS.bloodRequests).createIndex({ status: 1, createdAt: -1 }),
    database().collection(MONGO_COLLECTIONS.demandRecords).createIndex({ city: 1, bloodGroup: 1, date: 1 }),
    database().collection(MONGO_COLLECTIONS.donorResponses).createIndex({ requestId: 1 }),
  ];
  const results = await Promise.allSettled(indexes);
  const failed = results.find(r => r.status === 'rejected');
  if (failed) {
    console.warn('[db] Some MongoDB indexes could not be created:', failed.reason?.message || failed.reason);
  }
}

async function connectMongo() {
  if (mongoReady) return;
  await mongoose.connect(MONGO_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 15000,
    connectTimeoutMS: 10000,
  });
  mongoReady = true;
  await ensureIndexes();
}

async function loadMongo() {
  let total = 0;
  for (const [key, name] of Object.entries(MONGO_COLLECTIONS)) {
    const docs = await database().collection(name).find({}).toArray();
    db[key].data = docs;
    total += docs.length;
    lastSynced.set(key, new Map(docs.map(d => [String(d._id), JSON.stringify(d)])));
  }
  return total;
}

function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) chunks.push(array.slice(i, i + size));
  return chunks;
}

async function persistMongo() {
  if (!mongoReady) return false;
  let wrote = false;

  for (const [key, name] of Object.entries(MONGO_COLLECTIONS)) {
    const docs = db[key].data;
    const previous = lastSynced.get(key) || new Map();
    const next = new Map();
    const ops = [];
    const seen = new Set();

    for (const doc of docs) {
      if (doc._id === undefined || doc._id === null) continue;
      const id = String(doc._id);
      seen.add(id);
      const serialized = JSON.stringify(doc);
      next.set(id, serialized);
      if (previous.get(id) !== serialized) {
        // Replace the whole document so every change made by the synchronous
        // route handlers is persisted, including nested matching data.
        ops.push({
          replaceOne: {
            filter: { _id: doc._id },
            replacement: doc,
            upsert: true,
          },
        });
      }
    }

    const removedIds = [...previous.keys()].filter(id => !seen.has(id));
    if (removedIds.length) {
      ops.push({ deleteMany: { filter: { _id: { $in: removedIds } } } });
    }

    if (ops.length) {
      const collection = database().collection(name);
      for (const batch of chunk(ops, 500)) {
        await collection.bulkWrite(batch, { ordered: false });
      }
      wrote = true;
    }

    // Only update the snapshot after a successful write. If anything throws,
    // the next persist retries the same differences.
    lastSynced.set(key, next);
  }

  return wrote;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Load data from MongoDB (when configured) or the JSON snapshot.
 * Returns { mode, hadData }. Callers seed when hadData is false.
 */
db.init = function init() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (!MONGO_URI) {
      const hadData = loadJson();
      return { mode: 'json', hadData };
    }

    await connectMongo();
    const total = await loadMongo();
    return { mode: 'mongodb', hadData: total > 0 };
  })().catch(err => {
    // Allow a later request to retry after a transient connection failure.
    initPromise = null;
    throw err;
  });

  return initPromise;
};

db.getMode = function getMode() {
  return mongoReady ? 'mongodb' : 'json';
};

/**
 * Persist the current in-memory data. In MongoDB mode only changed documents
 * are written (diff against the last successful sync). Safe to call
 * concurrently: calls are serialized through a promise chain.
 */
db.persist = function persist(options = {}) {
  const run = () => (mongoReady ? persistMongo(options) : persistJson());
  persistChain = persistChain.then(run, run);
  return persistChain;
};

db.load = loadJson;

db.close = async function close() {
  if (mongoReady) {
    await mongoose.disconnect();
    mongoReady = false;
  }
};

db.dataFile = DATA_FILE;

module.exports = db;
