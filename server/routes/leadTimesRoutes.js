const express = require('express');
const router = express.Router();
const { dbHelpers } = require('../db/database');

// Helper to parse script date from version
function parseScriptDate(version) {
  if (!version) return null;
  
  // Try to extract date from version like V20231215... or V2023.12.15...
  const patterns = [
    /^V?(\d{4})(\d{2})(\d{2})/,      // V20231215
    /^V?(\d{4})\.(\d{2})\.(\d{2})/,  // V2023.12.15
    /^V?(\d{4})-(\d{2})-(\d{2})/,    // V2023-12-15
    /^V?(\d{4})_(\d{2})_(\d{2})/     // V2023_12_15
  ];
  
  for (const pattern of patterns) {
    const match = version.match(pattern);
    if (match) {
      const [, year, month, day] = match;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }
  
  return null;
}

// GET lead times
router.get('/api/metrics/lead-times', (req, res) => {
  try {
    const data = dbHelpers.getLeadTimes();
    res.json(data);
  } catch (e) {
    console.error('Get lead times error:', e);
    res.status(500).json({ message: 'Failed to get lead times' });
  }
});

// Refresh lead times from flyway history
router.get('/api/metrics/lead-times/refresh', async (req, res) => {
  try {
    let history = [];

    // Get flyway history
    try {
      const flywayHistory = require('../flywayHistory');
      if (flywayHistory?.getFlywayHistory) {
        history = await flywayHistory.getFlywayHistory() ?? [];
      }
    } catch (e) {
      console.warn('Failed to get flyway history:', e);
    }

    const leadTimes = [];
    const msPerDay = 24 * 60 * 60 * 1000;

    history.forEach(m => {
      const version = m.version ?? m.version_number ?? '';
      if (!version || String(version).startsWith('U')) return;

      const scriptDate = parseScriptDate(version);
      if (!scriptDate) return;

      const deployDate = new Date(m.installed_on || m.installedOn || m.installed || m.installedOnUtc);
      if (isNaN(deployDate.getTime())) return;

      const rawLeadTime = (deployDate - scriptDate) / msPerDay;
      const leadTimeDays = Math.max(0, rawLeadTime);

      leadTimes.push({
        script: m.script,
        version: version,
        scriptDate: scriptDate.toISOString(),
        deployDate: deployDate.toISOString(),
        leadTimeDays,
        originalLeadTime: rawLeadTime
      });
    });

    const data = dbHelpers.clearAndInsertLeadTimes(leadTimes);
    res.json(data);
  } catch (e) {
    console.error('Refresh lead times error:', e);
    res.status(500).json({ message: 'Failed to refresh lead times' });
  }
});

module.exports = router;