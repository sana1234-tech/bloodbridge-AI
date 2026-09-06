/**
 * Local development entry point — starts the HTTP listener.
 * The app itself lives in app.js so it can also run as a serverless
 * function (see ../api/index.js) without a listener.
 */
const app = require('./app');
const db = require('./store');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`BloodBridge AI server running on port ${PORT}`);
  console.log(`Donors: ${db.donors.data.length} | Hospitals: ${db.hospitals.data.length} | Demand Records: ${db.demandRecords.data.length}`);
});
