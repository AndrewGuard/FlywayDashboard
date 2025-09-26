const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const { getFlywayHistory } = require('./flywayHistory');

const configPath = path.join(__dirname, 'jdbc-connections.json');
if (!fs.existsSync(configPath)) fs.writeFileSync(configPath, JSON.stringify([]));

// Get all JDBC connections (prod and nonProd buckets)
router.get('/', (req, res) => {
  const data = JSON.parse(fs.readFileSync(configPath));
  // If old array format, treat all as nonProd
  if (Array.isArray(data)) {
    res.json({ prod: [], nonProd: data });
  } else {
    res.json(data);
  }
});

// Add a new JDBC connection (default to nonProd)
router.post('/', (req, res) => {
  const { connectionString, bucket = 'nonProd' } = req.body;
  if (!connectionString) return res.status(400).json({ error: 'Missing connectionString' });
  let data = JSON.parse(fs.readFileSync(configPath));
  if (Array.isArray(data)) {
    // Old format, treat as nonProd
    if (!data.includes(connectionString)) data.push(connectionString);
    fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
    return res.json({ prod: [], nonProd: data });
  }
  if (!Array.isArray(data[bucket])) data[bucket] = [];
  if (!data[bucket].includes(connectionString)) data[bucket].push(connectionString);
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
  res.json(data);
});

// Cache for migration history
let cachedHistory = null;
let lastFetched = 0;
let fetching = false;

async function refreshHistory() {
  if (fetching) return;
  fetching = true;
  try {
    cachedHistory = await getFlywayHistory();
    lastFetched = Date.now();
  // Removed verbose Flyway API migration history logging
  } catch (err) {
    cachedHistory = [{ error: err.message }];
    console.error('[Flyway API] Error refreshing migration history:', err);
  } finally {
    fetching = false;
  }
}

// Refresh every minute
setInterval(refreshHistory, 60 * 1000);
// Initial fetch
refreshHistory();

// Get Flyway migration history from all databases (cached)
router.get('/history', async (req, res) => {
  if (!cachedHistory) {
    await refreshHistory();
  }
  // For compatibility, flatten prod and nonProd for history queries
  const data = JSON.parse(fs.readFileSync(configPath));
  let allConnections = [];
  if (Array.isArray(data)) {
    allConnections = data;
  } else {
    allConnections = [...(data.prod || []), ...(data.nonProd || [])];
  }
  // If the cachedHistory is an array of dbs, filter to only those in allConnections
  if (Array.isArray(cachedHistory)) {
    const filtered = cachedHistory.filter(db => {
      // db.dbName or db.connectionString or similar
      if (db.connectionString) return allConnections.includes(db.connectionString);
      return true; // fallback: include all
    });
    return res.json(filtered);
  }
  res.json(cachedHistory);
});

// add a small helper to close pools safely and use it where appropriate

async function safeClosePool(pool) {
  if (!pool) return;
  try {
    // pool.connected and pool.connecting are set by mssql ConnectionPool
    if (pool.connected) {
      await pool.close();
      return;
    }
    if (pool.connecting) {
      // wait until connection completes (success or error), then try closing once
      await new Promise((resolve) => {
        const onConnect = () => {
          cleanup();
          resolve();
        };
        const onError = () => {
          cleanup();
          resolve();
        };
        function cleanup() {
          pool.removeListener('connect', onConnect);
          pool.removeListener('error', onError);
        }
        pool.on('connect', onConnect);
        pool.on('error', onError);
      });
      // attempt close after connecting settles
      if (pool.connected) {
        try { await pool.close(); } catch (_) { /* swallow */ }
      }
      return;
    }
    // fallback: try close once
    try { await pool.close(); } catch (_) { /* swallow */ }
  } catch (e) {
    // swallow to avoid crashing background refresh tasks
    console.warn('safeClosePool error', e && e.message || e);
  }
}

// attach helper to router so importers can access it
router.safeClosePool = safeClosePool;

// export the router (do not overwrite with an object)
module.exports = router;