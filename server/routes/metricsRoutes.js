const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const SUMMARY_FILE = path.join(__dirname, '..', 'deployments-summary.json');
const FLYWAY_HISTORY_CACHE = path.join(__dirname, '..', 'flyway-history.json');
const { computeDeploymentsPerQuarter } = require('../utils/deploymentsCalculator');

// GET cached summary (always return a valid JSON shape)
router.get('/api/metrics/deployments-per-quarter', (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  try {
    if (fs.existsSync(SUMMARY_FILE)) {
      const raw = fs.readFileSync(SUMMARY_FILE, 'utf8');
      if (!raw || !raw.trim()) return res.status(200).json({ deploymentsPerQuarter: 0, extrapolated: false, availableDays: 0, updatedAt: null });
      try {
        const json = JSON.parse(raw);
        return res.status(200).json(json);
      } catch (e) {
        console.warn('deployments-summary parse error', e);
        return res.status(200).json({ deploymentsPerQuarter: 0, extrapolated: false, availableDays: 0, updatedAt: null });
      }
    }
    return res.status(200).json({ deploymentsPerQuarter: 0, extrapolated: false, availableDays: 0, updatedAt: null });
  } catch (e) {
    console.error('read summary error', e);
    return res.status(500).json({ message: 'read error' });
  }
});

// Regenerate summary from flyway history, write JSON and return it.
// This is called by frontend on page load to ensure backend refresh.
router.get('/api/metrics/deployments-per-quarter/refresh', async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  try {
    let history = null;

    // Prefer server-side flywayHistory module if present
    try {
      const fh = require('../flywayHistory');
      if (fh && typeof fh.getFlywayHistory === 'function') {
        history = await fh.getFlywayHistory();
      }
    } catch (e) {
      // ignore and fall back to cached file
    }

    if (!Array.isArray(history)) {
      if (fs.existsSync(FLYWAY_HISTORY_CACHE)) {
        try {
          const raw = fs.readFileSync(FLYWAY_HISTORY_CACHE, 'utf8');
          history = raw && raw.trim() ? JSON.parse(raw) : [];
        } catch (e) {
          console.warn('failed to parse flyway-history.json, using empty history', e);
          history = [];
        }
      } else {
        history = [];
      }
    }

    const summary = computeDeploymentsPerQuarter(history);
    const out = { ...summary, updatedAt: new Date().toISOString() };
    fs.writeFileSync(SUMMARY_FILE, JSON.stringify(out, null, 2), 'utf8');
    return res.status(200).json(out);
  } catch (err) {
    console.error('regenerate deployments summary error', err);
    return res.status(500).json({ message: 'regenerate error' });
  }
});

module.exports = router;