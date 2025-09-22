// Shared utility to calculate Flyway metrics from history (uses shared util)
const { calculateFlywayMetrics } = require('./flywayMetricsUtil');
const fs = require('fs');
const path = require('path');

function calculateFlywayInferredMetrics(flywayData) {
  // Load migration lead times from file
  let leadTimesData = {};
  try {
    const leadTimesPath = path.join(__dirname, 'migration-lead-times.json');
    leadTimesData = JSON.parse(fs.readFileSync(leadTimesPath, 'utf8'));
  } catch {}
  // Use shared util for metrics
  const metrics = calculateFlywayMetrics(flywayData, leadTimesData);
  // Only return the relevant fields for inferred metrics
  return {
    deploymentsPerQuarter: metrics.deploymentsPerQuarter,
    leadTimeDays: metrics.leadTimeDays,
    changeInDeploymentDurationDays: metrics.deploymentDurationDays // for compatibility
  };
}

module.exports = { calculateFlywayInferredMetrics };
