const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const DEPLOYMENTS_CACHE = path.join(__dirname, '..', 'deployments-over-time.json');
const FLYWAY_HISTORY_CACHE = path.join(__dirname, '..', 'flyway-history.json');

function safeWriteJson(filePath, obj) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('safeWriteJson error', e);
    return false;
  }
}

function pointsFromCounts(counts) {
  const dates = Object.keys(counts).sort();
  let points = dates.map(date => ({ date, count: counts[date] }));
  if (!points.length) {
    const today = new Date().toISOString().slice(0, 10);
    points = [{ date: today, count: 0 }];
  }
  if (points.length === 1) {
    const next = new Date(points[0].date);
    next.setDate(next.getDate() + 1);
    points = [...points, { date: next.toISOString().slice(0, 10), count: points[0].count }];
  }
  return points;
}

// GET cached points (always return valid JSON)
router.get('/api/cache/deployments-over-time', (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  try {
    if (fs.existsSync(DEPLOYMENTS_CACHE)) {
      const raw = fs.readFileSync(DEPLOYMENTS_CACHE, 'utf8');
      if (!raw || raw.trim() === '') return res.status(200).json({ points: [] });
      try {
        const json = JSON.parse(raw);
        const pts = Array.isArray(json.points) ? json.points : (Array.isArray(json) ? json : []);
        return res.status(200).json({ points: pts });
      } catch (e) {
        console.warn('deployments cache parse error, returning empty points', e);
        return res.status(200).json({ points: [] });
      }
    }
    return res.status(200).json({ points: [] });
  } catch (e) {
    console.error('read deployments cache error', e);
    return res.status(500).json({ message: 'read error' });
  }
});

// POST to write cached points (be tolerant)
router.post('/api/cache/deployments-over-time', express.json(), (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  try {
    const payload = req.body || {};
    const points = Array.isArray(payload.points) ? payload.points : (Array.isArray(payload) ? payload : null);
    if (!Array.isArray(points)) {
      return res.status(400).json({ message: 'invalid payload' });
    }
    safeWriteJson(DEPLOYMENTS_CACHE, { points });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('write deployments cache error', e);
    return res.status(500).json({ message: 'write error' });
  }
});

// Regenerate deployments-over-time.json from Flyway history and return points
router.get('/api/cache/deployments-over-time/regenerate', async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  try {
    let history = null;
    // prefer server-side module if present
    try {
      const fh = require('../flywayHistory');
      if (fh && typeof fh.getFlywayHistory === 'function') {
        history = await fh.getFlywayHistory();
      }
    } catch (e) {
      // ignore and fall back to cached file
    }

    // fallback to cached flyway-history.json file
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

    // compute counts for versioned scripts only (exclude undo 'U' and repeatable/no-version)
    const counts = {};
    (Array.isArray(history) ? history : []).forEach(m => {
      const version = m.version ?? m.version_number ?? m. version ?? null;
      // if version missing or falsy, skip (repeatable or baseline entries)
      if (!version) return;
      const vstr = String(version).trim();
      if (!vstr) return;
      if (vstr.startsWith('U')) return; // exclude undo migrations
      const inst = m.installed_on || m.installedOn || m.installedOnUtc || m.installed;
      if (!inst) return;
      const d = new Date(inst);
      if (Number.isNaN(d.getTime())) return;
      const key = d.toISOString().slice(0, 10);
      counts[key] = (counts[key] || 0) + 1;
    });

    const points = pointsFromCounts(counts);

    // write deployments-over-time cache
    safeWriteJson(DEPLOYMENTS_CACHE, { points });

    return res.status(200).json({ points });
  } catch (err) {
    console.error('regenerate deployments cache error', err);
    return res.status(500).json({ message: 'regenerate error' });
  }
});

module.exports = router;