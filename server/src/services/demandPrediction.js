const db = require('../store');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

/**
 * Core forecast for one (city, blood group) series: weighted 14-day moving
 * average + linear regression trend + weekday multiplier.
 * `history` must contain only records dated before `targetDate`.
 */
function forecastUnits(history, targetDate, daysAhead) {
  const recent = history.slice(-14);
  const weights = recent.map((_, i) => i + 1);
  const totalWeight = weights.reduce((s, w) => s + w, 0) || 1;
  const weightedAvg = recent.reduce((sum, r, i) => sum + r.unitsRequested * weights[i], 0) / totalWeight;

  // Linear regression trend over the recent window
  const n = recent.length;
  const xMean = (n - 1) / 2;
  const yMean = recent.reduce((s, r) => s + r.unitsRequested, 0) / (n || 1);
  let num = 0, den = 0;
  recent.forEach((r, i) => {
    num += (i - xMean) * (r.unitsRequested - yMean);
    den += (i - xMean) ** 2;
  });
  const slope = den !== 0 ? num / den : 0;

  const dow = targetDate.getDay();
  const dowMul = dow >= 1 && dow <= 5 ? 1.15 : 0.82;
  const noise = Math.sin(targetDate.getTime() / 1000000) * 1.5;

  return Math.max(1, Math.round((weightedAvg + slope * daysAhead * 0.3) * dowMul + noise));
}

function predictDemand(city, bloodGroup, days = 7) {
  let records = db.demandRecords.data;

  if (city) records = records.filter(r => r.city === city);
  if (bloodGroup) records = records.filter(r => r.bloodGroup === bloodGroup);

  if (records.length === 0) {
    return generateFallback(city, bloodGroup, days);
  }

  // Group by city + bloodGroup
  const grouped = {};
  records.forEach(r => {
    const key = `${r.city}|${r.bloodGroup}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
  });

  const predictions = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  Object.entries(grouped).forEach(([key, data]) => {
    const [recordCity, recordBG] = key.split('|');
    data.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Fulfillment rate over the last 30 days of history
    const last30 = data.slice(-30);
    const totalReq = last30.reduce((s, r) => s + r.unitsRequested, 0);
    const totalFul = last30.reduce((s, r) => s + r.unitsFulfilled, 0);
    const fulfillmentRate = totalReq > 0 ? totalFul / totalReq : 0.8;

    for (let d = 1; d <= days; d++) {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + d);

      const demand = forecastUnits(data, futureDate, d);

      const predictedFulfillment = Math.round(demand * fulfillmentRate);
      const gap = demand - predictedFulfillment;

      let riskLevel = 'stable';
      if (fulfillmentRate < 0.75 || gap > 5) riskLevel = 'shortage';
      else if (fulfillmentRate > 0.9 && gap <= 2) riskLevel = 'surplus';

      // Trend for display: compare next-day forecast with the recent average
      const recent = data.slice(-14);
      const avg = recent.length ? recent.reduce((s, r) => s + r.unitsRequested, 0) / recent.length : demand;

      predictions.push({
        date: futureDate.toISOString().split('T')[0],
        city: recordCity,
        bloodGroup: recordBG,
        predictedDemand: demand,
        predictedFulfillment,
        gap,
        riskLevel,
        fulfillmentRate: parseFloat((fulfillmentRate * 100).toFixed(1)),
        trend: demand > avg * 1.05 ? 'rising' : demand < avg * 0.95 ? 'falling' : 'stable',
      });
    }
  });

  return predictions;
}

/**
 * Backtest the forecasting model: for each of the last `testDays` days with
 * real data, re-run the model using only prior history (one day ahead) and
 * compare against the actual recorded demand. Returns MAPE-based accuracy so
 * the "AI" claim is measurable, not just asserted.
 */
function backtestAccuracy(city, bloodGroup, testDays = 14) {
  let records = db.demandRecords.data;
  if (city) records = records.filter(r => r.city === city);
  if (bloodGroup) records = records.filter(r => r.bloodGroup === bloodGroup);

  const grouped = {};
  records.forEach(r => {
    const key = `${r.city}|${r.bloodGroup}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
  });

  const groups = [];
  let totalAbsPct = 0;
  let totalSamples = 0;

  Object.entries(grouped).forEach(([key, data]) => {
    data.sort((a, b) => new Date(a.date) - new Date(b.date));

    let absPctSum = 0;
    let samples = 0;

    data.slice(-testDays).forEach(record => {
      const targetDate = new Date(record.date);
      const history = data.filter(r => new Date(r.date).getTime() < targetDate.getTime());
      if (history.length < 14) return; // not enough history to forecast

      const predicted = forecastUnits(history, targetDate, 1);
      const actual = record.unitsRequested;
      absPctSum += Math.abs(predicted - actual) / Math.max(actual, 1);
      samples++;
    });

    if (samples === 0) return;

    const mape = absPctSum / samples;
    const [recordCity, recordBG] = key.split('|');
    groups.push({
      city: recordCity,
      bloodGroup: recordBG,
      accuracy: Math.round(Math.max(0, 100 - mape * 100) * 10) / 10,
      samples,
    });

    totalAbsPct += absPctSum;
    totalSamples += samples;
  });

  if (totalSamples === 0) {
    return { accuracy: null, samples: 0, testDays, groups: [] };
  }

  const overallMape = totalAbsPct / totalSamples;
  return {
    accuracy: Math.round(Math.max(0, 100 - overallMape * 100) * 10) / 10,
    samples: totalSamples,
    testDays,
    // Sorted worst-first so the riskiest series stand out
    groups: groups.sort((a, b) => a.accuracy - b.accuracy),
  };
}

function generateFallback(city, bloodGroup, days) {
  const predictions = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cities = city ? [city] : ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan'];
  const groups = bloodGroup ? [bloodGroup] : BLOOD_GROUPS;

  cities.forEach(c => {
    groups.forEach(bg => {
      const base = bg === 'O+' ? 18 : bg === 'B+' ? 16 : bg === 'A+' ? 13 : 8;
      for (let d = 1; d <= days; d++) {
        const fd = new Date(today);
        fd.setDate(today.getDate() + d);
        const dow = fd.getDay();
        const mul = dow >= 1 && dow <= 5 ? 1.15 : 0.82;
        const demand = Math.round(base * mul);
        const fulfilled = Math.round(demand * 0.8);
        predictions.push({
          date: fd.toISOString().split('T')[0], city: c, bloodGroup: bg,
          predictedDemand: demand, predictedFulfillment: fulfilled,
          gap: demand - fulfilled, riskLevel: 'stable', fulfillmentRate: 80.0, trend: 'stable',
        });
      }
    });
  });

  return predictions;
}

module.exports = { predictDemand, backtestAccuracy, forecastUnits };
