const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

// Initialize database
const { db, dbHelpers } = require('./db/database');
console.log('Database initialized');

// Import routes
const userMetricsRoutes = require('./routes/userMetricsRoutes');
const leadTimeHistoryRoutes = require('./routes/leadTimeHistoryRoutes');
const leadTimesRoutes = require('./routes/leadTimesRoutes');
const deploymentsRoutes = require('./routes/deploymentsRoutes');

// Register routes
app.use(userMetricsRoutes);
app.use(leadTimeHistoryRoutes);
app.use(leadTimesRoutes);
app.use(deploymentsRoutes);

// JDBC Connections endpoint
app.get('/api/jdbc-connections', (req, res) => {
  try {
    const connections = dbHelpers.getJdbcConnections ? dbHelpers.getJdbcConnections() : [];
    res.json(Array.isArray(connections) ? connections : []);
  } catch (e) {
    console.error('Get JDBC connections error:', e);
    res.json([]);
  }
});

app.get('/api/jdbc-connections/history', async (req, res) => {
  try {
    // Return flyway history from database
    const flywayHistory = require('./flywayHistory');
    const history = await flywayHistory.getFlywayHistory();
    res.json(Array.isArray(history) ? history : []);
  } catch (e) {
    console.error('Get JDBC connections history error:', e);
    res.json([]);
  }
});

// Flyway history endpoints
app.get('/api/flyway-history', async (req, res) => {
  try {
    const flywayHistory = require('./flywayHistory');
    const history = await flywayHistory.getFlywayHistory();
    res.json(Array.isArray(history) ? history : []);
  } catch (e) {
    console.error('Flyway history error:', e);
    res.json([]);
  }
});

app.get('/api/flyway/history/all', async (req, res) => {
  try {
    const flywayHistory = require('./flywayHistory');
    const history = await flywayHistory.getFlywayHistory();
    res.json(Array.isArray(history) ? history : []);
  } catch (e) {
    console.error('Flyway history all error:', e);
    res.json([]);
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
