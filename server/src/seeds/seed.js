/**
 * Seed the verified facility directory plus the optional local demo dataset.
 *
 * Usage (from the server folder): npm run seed
 *
 * Uses the same store and seed data as the API, so MongoDB and the local JSON
 * fallback stay in sync. If data already exists, the script does nothing —
 * drop/clear the database first when you want a fresh dataset.
 */
require('dotenv').config({ quiet: true });
const db = require('../store');
const { seedData, shouldSeedDemoData } = require('./seedInMemory');

(async () => {
  const { mode, hadData } = await db.init();

  if (hadData) {
    console.log(`[seed] ${mode} already contains data — nothing to do.`);
    console.log('[seed] Clear the database (or delete server/data/bloodbridge-data.json) to reseed.');
    await db.close();
    return;
  }

  seedData({ includeDemo: shouldSeedDemoData() });
  await db.persist({ force: true });
  console.log(`[seed] Seed data written to ${mode}.`);
  await db.close();
})().catch(async (err) => {
  console.error('[seed] Failed:', err.message);
  process.exitCode = 1;
  try { await db.close(); } catch { /* ignore */ }
});
