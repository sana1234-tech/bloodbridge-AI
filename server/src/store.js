/**
 * In-memory data store for BloodBridge AI.
 * Replaces MongoDB with a simple in-memory store for hackathon prototype.
 * Mimics Mongoose-like interface.
 * Data is persisted to a JSON file so restarts never lose demo data.
 */

const fs = require('fs');
const path = require('path');

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

// Save a snapshot of the in-memory store to disk.
db.persist = function persist() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify({
      donors: db.donors.data,
      hospitals: db.hospitals.data,
      bloodRequests: db.bloodRequests.data,
      demandRecords: db.demandRecords.data,
      users: db.users.data,
      donorResponses: db.donorResponses.data,
      savedAt: new Date().toISOString(),
    }));
    return true;
  } catch (err) {
    console.error('Failed to persist data:', err.message);
    return false;
  }
};

// Restore a previously persisted snapshot. Returns false when none exists.
db.load = function load() {
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
};

module.exports = db;
