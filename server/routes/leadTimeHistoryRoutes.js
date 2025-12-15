const express = require('express');
const router = express.Router();
const { dbHelpers } = require('../db/database');

// GET lead time history
router.get('/api/metrics/lead-time-history', (req, res) => {
  try {
    const data = dbHelpers.getLeadTimeHistory();
    res.json(data);
  } catch (e) {
    console.error('Get lead time history error:', e);
    res.status(500).json({ message: 'Failed to get lead time history' });
  }
});

// Refresh lead time history
router.get('/api/metrics/lead-time-history/refresh', (req, res) => {
  try {
    let flywayLeadTime = 0;
    let nonFlywayLeadTime = 0;

    // Get user-defined metrics for non-Flyway lead time
    try {
      const userData = dbHelpers.getUserMetrics();
      nonFlywayLeadTime = Number(userData?.leadTimeDays) || 0;
    } catch (e) {
      console.warn('Failed to get user metrics:', e);
    }

    // Get Flyway lead times
    try {
      const leadTimesData = dbHelpers.getLeadTimes();
      if (leadTimesData?.leadTimes?.length) {
        const validTimes = leadTimesData.leadTimes
          .map(lt => Number(lt.leadTimeDays))
          .filter(n => Number.isFinite(n) && n >= 0);
        if (validTimes.length) {
          flywayLeadTime = validTimes.reduce((sum, t) => sum + t, 0) / validTimes.length;
        }
      }
    } catch (e) {
      console.warn('Failed to get Flyway lead times:', e);
    }

    const today = new Date().toISOString().slice(0, 10);
    const newPoint = {
      date: today,
      flywayLeadTime: Math.max(0, Math.round(flywayLeadTime * 10) / 10),
      nonFlywayLeadTime: Math.max(0, nonFlywayLeadTime),
      timestamp: new Date().toISOString()
    };

    const data = dbHelpers.upsertLeadTimeHistory(newPoint);
    res.json(data);
  } catch (e) {
    console.error('Refresh lead time history error:', e);
    res.status(500).json({ message: 'Failed to refresh lead time history' });
  }
});

module.exports = router;