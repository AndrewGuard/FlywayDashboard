const fs = require('fs');
const path = require('path');

const metricsPath = path.join(__dirname, 'user-defined-metrics.json');
const defaults = {
  deploymentsPerQuarter: 20,
  leadTimeDays: 15,
  scriptFailureRate: 10
};

function getUserDefinedMetrics() {
  try {
    if (!fs.existsSync(metricsPath)) return { ...defaults };
    const data = fs.readFileSync(metricsPath, 'utf8');
    const parsed = JSON.parse(data);
    // If all values are null/undefined/empty, return defaults
    const allNull = Object.values(parsed).every(v => v === null || v === undefined || v === '');
    if (allNull) return { ...defaults };
    // Fill in any missing fields with defaults
    return { ...defaults, ...parsed };
  } catch (e) {
    return { ...defaults };
  }
}

function setUserDefinedMetrics(metrics) {
  const merged = { ...defaults, ...metrics };
  fs.writeFileSync(metricsPath, JSON.stringify(merged, null, 2), 'utf8');
  return merged;
}

module.exports = {
  getUserDefinedMetrics,
  setUserDefinedMetrics,
  defaults
};
