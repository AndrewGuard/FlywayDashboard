const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const LEAD_TIME_HISTORY_FILE = path.join(__dirname, '..', 'lead-time-history.json');

function initializeFile() {
  if (!fs.existsSync(LEAD_TIME_HISTORY_FILE)) {
    fs.writeFileSync(LEAD_TIME_HISTORY_FILE, JSON.stringify({ dataPoints: [] }, null, 2));
  }
}

router.get('/api/metrics/lead-time-history', (req, res) => {
  initializeFile();
  try {
    const raw = fs.readFileSync(LEAD_TIME_HISTORY_FILE, 'utf8');
    res.json(JSON.parse(raw));
  } catch (e) {
    res.status(500).json({ message: 'Failed to read lead time history' });
  }
});

router.get('/api/metrics/lead-time-history/refresh', async (req, res) => {
  initializeFile();
  try {
    let flywayLeadTime = 0;
    let nonFlywayLeadTime = 0;

    // Get user-defined metrics for non-Flyway lead time
    try {
      const userMetricsFile = path.join(__dirname, '..', 'user-defined-metrics.json');
      if (fs.existsSync(userMetricsFile)) {
        const userData = JSON.parse(fs.readFileSync(userMetricsFile, 'utf8'));
        nonFlywayLeadTime = Number(userData?.leadTimeDays) || 0;
      }
    } catch (e) {
      console.warn('Failed to get user metrics:', e);
    }

    // Get Flyway lead times
    try {
      const leadTimesFile = path.join(__dirname, '..', 'lead-times.json');
      if (fs.existsSync(leadTimesFile)) {
        const leadTimesData = JSON.parse(fs.readFileSync(leadTimesFile, 'utf8'));
        if (leadTimesData?.leadTimes?.length) {
          const validTimes = leadTimesData.leadTimes
            .map(lt => Number(lt.leadTimeDays))
            .filter(n => Number.isFinite(n) && n >= 0);
          if (validTimes.length) {
            flywayLeadTime = validTimes.reduce((sum, t) => sum + t, 0) / validTimes.length;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to get Flyway lead times:', e);
    }

    const raw = fs.readFileSync(LEAD_TIME_HISTORY_FILE, 'utf8');
    const data = JSON.parse(raw);
    const today = new Date().toISOString().slice(0, 10);
    const newPoint = {
      date: today,
      flywayLeadTime: Math.max(0, Math.round(flywayLeadTime * 10) / 10),
      nonFlywayLeadTime: Math.max(0, nonFlywayLeadTime),
      timestamp: new Date().toISOString()
    };

    const idx = data.dataPoints.findIndex(p => p.date === today);
    if (idx >= 0) data.dataPoints[idx] = newPoint;
    else data.dataPoints.push(newPoint);
    data.dataPoints.sort((a, b) => new Date(a.date) - new Date(b.date));

    fs.writeFileSync(LEAD_TIME_HISTORY_FILE, JSON.stringify(data, null, 2));
    res.json(data);
  } catch (e) {
    console.error('Refresh lead-time-history error:', e);
    res.status(500).json({ message: 'Failed to refresh lead time history' });
  }
});

module.exports = router;