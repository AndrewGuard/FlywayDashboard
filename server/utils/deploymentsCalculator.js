/**
 * Compute deployments per quarter from flyway history rows.
 * Rows expected to include version and an installed timestamp (installed_on / installedOn / installed).
 * Returns { deploymentsPerQuarter, extrapolated, availableDays }
 */
function computeDeploymentsPerQuarter(history = []) {
  const dates = (Array.isArray(history) ? history : [])
    .map(m => {
      const version = m.version ?? m.version_number ?? m.version_number_string ?? null;
      if (!version) return null;
      const vstr = String(version).trim();
      if (!vstr || vstr.startsWith('U')) return null; // skip undo/repeatable/no-version
      const inst = m.installed_on || m.installedOn || m.installed || m.installedOnUtc || m.timestamp;
      if (!inst) return null;
      const d = new Date(inst);
      return Number.isFinite(d.getTime()) ? d.toISOString().slice(0,10) : null;
    })
    .filter(Boolean)
    .sort();

  if (!dates.length) {
    return { deploymentsPerQuarter: 0, extrapolated: false, availableDays: 0 };
  }

  const minDate = new Date(dates[0]);
  const maxDate = new Date(dates[dates.length - 1]);
  const msPerDay = 24 * 60 * 60 * 1000;
  const availableDays = Math.max(1, Math.round((maxDate - minDate) / msPerDay) + 1);

  const COUNT_QUARTER_DAYS = 90;

  if (availableDays >= COUNT_QUARTER_DAYS) {
    const windowStart = new Date(maxDate);
    windowStart.setDate(windowStart.getDate() - (COUNT_QUARTER_DAYS - 1));
    const windowStartKey = windowStart.toISOString().slice(0,10);
    const countLast90 = dates.filter(d => d >= windowStartKey).length;
    return { deploymentsPerQuarter: Math.round(countLast90), extrapolated: false, availableDays };
  }

  const totalCount = dates.length;
  const extrapolatedValue = Math.round((totalCount / availableDays) * COUNT_QUARTER_DAYS);
  return { deploymentsPerQuarter: extrapolatedValue, extrapolated: true, availableDays };
}

module.exports = { computeDeploymentsPerQuarter };