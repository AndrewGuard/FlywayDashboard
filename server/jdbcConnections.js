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

// Get Flyway migration history from all databases
router.get('/history', async (req, res) => {
  try {
    const data = await getFlywayHistory();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});