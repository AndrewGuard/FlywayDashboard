const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const CACHE_FILE = path.join(__dirname, '..', 'flyway-history.json');

// Helper: flatten the server-side cached shape [{dbName, history:[...]}] -> [{ dbName, ...row }, ...]
function flattenHistoryShape(raw) {
  const out = [];
  (Array.isArray(raw) ? raw : []).forEach(dbEntry => {
    const name = dbEntry.dbName || dbEntry.db || dbEntry.connStr || 'unknown';
    const hist = Array.isArray(dbEntry.history) ? dbEntry.history : (Array.isArray(dbEntry) ? dbEntry : []);
    hist.forEach(row => {
      out.push({ dbName: name, ...row });
    });
  });
  return out;
}

router.get('/api/flyway/history/all', async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  try {
    // prefer server-side function if present
    try {
      const fh = require('../flywayHistory');
      if (fh && typeof fh.getFlywayHistory === 'function') {
        const data = await fh.getFlywayHistory();
        // if data is per-db shape, flatten to rows for frontend consumers
        if (Array.isArray(data) && data.length && (data[0].history || data[0].dbName)) {
          return res.status(200).json(flattenHistoryShape(data));
        }
        // otherwise return data as-is (already flat)
        return res.status(200).json(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      // ignore and fall back to cached file
    }

    // fallback to cached file if available
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, 'utf8');
      if (!raw || raw.trim() === '') return res.status(200).json([]);
      try {
        const json = JSON.parse(raw);
        // If cached file is per-db shape, flatten it
        if (Array.isArray(json) && json.length && json[0].history) {
          return res.status(200).json(flattenHistoryShape(json));
        }
        // If it's an object with .items or .history arrays, try to normalize
        if (json.items && Array.isArray(json.items)) return res.status(200).json(json.items);
        if (Array.isArray(json)) return res.status(200).json(json);
        return res.status(200).json([]);
      } catch (e) {
        console.warn('flyway-history parse error, returning empty array', e);
        return res.status(200).json([]);
      }
    }

    // no data available
    return res.status(200).json([]);
  } catch (err) {
    console.error('[server] /api/flyway/history/all error', err);
    return res.status(200).json([]); // return empty instead of 500
  }
});

module.exports = router;