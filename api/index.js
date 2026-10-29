/**
 * Vercel serverless entry point — re-exports the Express app.
 *
 * All /api/* requests are routed here by the rewrite in vercel.json;
 * Vercel invokes the exported Express app directly with (req, res).
 * The real facility directory and admin seed on first boot (see server/src/app.js).
 * Synthetic demo donors/demand are opt-in with SEED_DEMO_DATA=true.
 */
module.exports = require('../server/src/app');
