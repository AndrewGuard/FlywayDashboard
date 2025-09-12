const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const { getFlywayHistory } = require('./flywayHistory');

const configPath = path.join(__dirname, 'jdbc-connections.json');
if (!fs.existsSync(configPath)) fs.writeFileSync(configPath, JSON.stringify([]));

// Get all JDBC connections
router.get('/', (req, res) => {
  const data = JSON.parse(fs.readFileSync(configPath));
  res.json(data);
});

// Add a new JDBC connection
router.post('/', (req, res) => {
  const { connectionString } = req.body;
  if (!connectionString) return res.status(400).json({ error: 'Missing connectionString' });
  const data = JSON.parse(fs.readFileSync(configPath));
  if (!data.includes(connectionString)) data.push(connectionString);
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
  res.json(data);
});

module.exports = router;


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
    console.log('[Flyway API] Migration history refreshed:', JSON.stringify(cachedHistory, null, 2));
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
  res.json(cachedHistory);
});