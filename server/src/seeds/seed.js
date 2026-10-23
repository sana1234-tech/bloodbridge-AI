/**
 * Seed the demo dataset into the configured storage.
 *
 * Usage (from the server folder): npm run seed
 *
 * Uses the same store and seed data as the API, so MongoDB and the local JSON
 * fallback stay in sync. If data already exists, the script does nothing —
 * drop/clear the database first when you want a fresh demo dataset.
 */
require('dotenv').config({ quiet: true });
const db = require('../store');
const { seedData } = require('./seedInMemory');

(async () => {
  const { mode, hadData } = await db.init();

  if (hadData) {
    console.log(`[seed] ${mode} already contains data — nothing to do.`);
    console.log('[seed] Clear the database (or delete server/data/bloodbridge-data.json) to reseed.');
    await db.close();
    return;
  }

  seedData();
  await db.persist({ force: true });
  console.log(`[seed] Demo data written to ${mode}.`);
  await db.close();
})().catch(async (err) => {
  console.error('[seed] Failed:', err.message);
  process.exitCode = 1;
  try { await db.close(); } catch { /* ignore */ }
});
