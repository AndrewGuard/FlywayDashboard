// Shared utility to calculate Flyway inferred metrics from history
function calculateFlywayInferredMetrics(flywayData) {
  // Only use prod data for metrics
  const prodKeys = Object.keys(flywayData).filter(k => k.toLowerCase().includes('prod'));
  const prodRows = prodKeys.map(k => flywayData[k]).flat();

  // Calculate deployments per quarter
  let deployments = 0;
  let minDate = null, maxDate = null;
  prodRows.forEach(row => {
    if (row.type && row.type.toLowerCase() !== 'undo' && row.type.toLowerCase() !== 'undo_sql') {
      deployments++;
      if (row.installed_on) {
        const d = new Date(row.installed_on).getTime();
        if (!isNaN(d)) {
          if (minDate === null || d < minDate) minDate = d;
          if (maxDate === null || d > maxDate) maxDate = d;
        }
      }
    }
  });
  // Extrapolate deployments per quarter if less than 90 days of data
  let deploymentsPerQuarter = deployments;
  if (minDate !== null && maxDate !== null) {
    const daysSpan = (maxDate - minDate) / (1000 * 60 * 60 * 24);
    if (daysSpan < 90 && daysSpan > 1) {
      deploymentsPerQuarter = deployments * (90 / daysSpan);
    }
  }

  // Calculate lead time (days) average, prod only
  // This expects the caller to have already calculated lead times per migration
  const prodLeadTimes = prodRows
    .map(row => row.leadTime)
    .filter(v => typeof v === 'number' && v >= 0);
  const leadTimeDays = prodLeadTimes.length > 0 ? prodLeadTimes.reduce((a, b) => a + b, 0) / prodLeadTimes.length : null;

  // Estimate deployment duration as the average of (completed_on - installed_on) for prod migrations
  let deploymentDurations = prodRows
    .filter(row => row.installed_on && row.completed_on)
    .map(row => {
      const start = new Date(row.installed_on).getTime();
      const end = new Date(row.completed_on).getTime();
      return !isNaN(start) && !isNaN(end) && end > start ? (end - start) / (1000 * 60 * 60 * 24) : null;
    })
    .filter(x => x !== null);
  const deploymentDurationDays = deploymentDurations.length > 0 ? deploymentDurations.reduce((a, b) => a + b, 0) / deploymentDurations.length : null;

  return { deploymentsPerQuarter, leadTimeDays, deploymentDurationDays };
}

module.exports = { calculateFlywayInferredMetrics };
