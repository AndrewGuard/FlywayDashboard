// Shared metrics calculation for Flyway Dashboard (frontend)

export function calculateFlywayMetrics(flywayData: any, leadTimesData: any): any {
  // Only use prod data for metrics
  const prodKeys = Object.keys(flywayData).filter(k => k.toLowerCase().includes('prod'));
  const prodRows = prodKeys.map(k => flywayData[k]).flat();

  // Calculate deployments per quarter
  let deployments = 0, failures = 0;
  let minDate: number | null = null, maxDate: number | null = null;
  prodRows.forEach(row => {
    if (row.type && row.type.toLowerCase() !== 'undo' && row.type.toLowerCase() !== 'undo_sql') {
      deployments++;
      if (row.success === false || row.success === 0) failures++;
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
  let deploymentsExtrapolated = false;
  if (minDate !== null && maxDate !== null) {
    const daysSpan = (maxDate - minDate) / (1000 * 60 * 60 * 24);
    if (daysSpan < 90 && daysSpan > 1) {
      deploymentsPerQuarter = deployments * (90 / daysSpan);
      deploymentsExtrapolated = true;
    }
  }

  // Calculate lead time (days) average, prod only
  const prodLeadTimes = Object.entries(leadTimesData)
    .filter(([key, value]) => key.toLowerCase().includes('prod') && typeof value === 'number' && value >= 0)
    .map(([key, value]) => value as number);
  const leadTimeDays = prodLeadTimes.length > 0 ? prodLeadTimes.reduce((a: number, b: number) => a + b, 0) / prodLeadTimes.length : null;

  const scriptFailureRate = deployments > 0 ? (failures / deployments) * 100 : null;

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

  return { deploymentsPerQuarter, leadTimeDays, scriptFailureRate, deploymentsExtrapolated, deploymentDurationDays };
}
