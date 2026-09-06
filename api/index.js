/**
 * Vercel serverless entry point — re-exports the Express app.
 *
 * All /api/* requests are routed here by the rewrite in vercel.json;
 * Vercel invokes the exported Express app directly with (req, res).
 * Demo data seeds itself on cold start (see server/src/app.js).
 */
module.exports = require('../server/src/app');
