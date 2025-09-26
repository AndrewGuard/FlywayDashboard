import { calculateFlywayMetrics } from './flywayMetricsUtil';

/**
 * Load user-defined metrics, raw Flyway history and lead times,
 * and return a calculated flyway metrics object using shared utility.
 */
export async function loadAllMetrics() {
  const result = {
    userData: null,
    flywayRaw: null,
    leadTimesData: null,
    flywayMetricsObj: null,
    errors: [],
  };

  try {
    const userRes = await fetch('/api/user-defined-metrics');
    if (userRes.ok) result.userData = await userRes.json();
    else result.errors.push('user-defined-metrics fetch failed');
  } catch (e) {
    result.errors.push('user-defined-metrics error');
  }

  try {
    const flywayRes = await fetch('/api/flyway/history/all');
    if (flywayRes.ok) result.flywayRaw = await flywayRes.json();
    else result.errors.push('flyway history fetch failed');
  } catch (e) {
    result.errors.push('flyway history error');
  }

  try {
    const leadTimesRes = await fetch('/server/migration-lead-times.json');
    if (leadTimesRes.ok) result.leadTimesData = await leadTimesRes.json();
    else result.errors.push('migration-lead-times fetch failed');
  } catch (e) {
    result.errors.push('migration-lead-times error');
  }

  try {
    if (result.flywayRaw && result.leadTimesData && typeof calculateFlywayMetrics === 'function') {
      result.flywayMetricsObj = calculateFlywayMetrics(result.flywayRaw, result.leadTimesData);
    }
  } catch (e) {
    result.errors.push('calculateFlywayMetrics error');
  }

  return result;
}