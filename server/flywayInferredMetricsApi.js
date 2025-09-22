// API for saving and retrieving Flyway-inferred metrics
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();


const inferredPath = path.join(__dirname, 'flyway-inferred-metrics.json');
const { getFlywayHistory } = require('./flywayHistory');
const { calculateFlywayInferredMetrics } = require('./flywayInferredMetricsUtil');

router.get('/flyway-inferred-metrics', async (req, res) => {
  try {
    let data = JSON.parse(fs.readFileSync(inferredPath, 'utf8'));
    // If any inferred metric is null, recalculate from history
    if (data.deploymentsPerQuarter == null || data.leadTimeDays == null || data.deploymentDurationDays == null) {
      const flywayHistory = await getFlywayHistory();
      // Flatten all histories into a single object keyed by dbName
      const flywayData = {};
      for (const db of flywayHistory) {
        flywayData[db.dbName] = db.history || [];
      }
      const inferred = calculateFlywayInferredMetrics(flywayData);
      data = { ...data, ...inferred };
      fs.writeFileSync(inferredPath, JSON.stringify(data, null, 2), 'utf8');
    }
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to read inferred metrics' });
  }
});

router.post('/flyway-inferred-metrics', (req, res) => {
  try {
    fs.writeFileSync(inferredPath, JSON.stringify(req.body, null, 2), 'utf8');
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to save inferred metrics' });
  }
});

module.exports = router;
