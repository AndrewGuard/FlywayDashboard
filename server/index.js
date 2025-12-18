// Initialize encryption FIRST (creates .env if needed)
const { initializeEncryption } = require('./utils/encryption');
const envCreated = initializeEncryption();

// Load environment variables AFTER initialization
require('dotenv').config({ override: envCreated });

const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

// Initialize database
const { db, dbHelpers } = require('./db/database');
console.log('Database initialized');

// Set DEMO_MODE=true environment variable to use mock data and auto-seed
// For production deployments, leave DEMO_MODE unset or set to false
const DEMO_MODE = process.env.DEMO_MODE === 'true';

if (DEMO_MODE) {
  console.log('🎭 Running in DEMO MODE - using mock data and auto-seeding');
  const { execSync } = require('child_process');
  try {
    const count = db.prepare('SELECT COUNT(*) as count FROM lead_time_history').get();
    if (count.count === 0) {
      console.log('Database is empty, seeding with demo data...');
      execSync('node refresh-all-demo-data.js', { stdio: 'inherit', cwd: __dirname });
    } else {
      console.log(`Database has ${count.count} lead time records`);
    }
  } catch (e) {
    console.log('Could not check/seed database:', e.message);
  }
} else {
  console.log('🚀 Running in PRODUCTION MODE - using real JDBC connections');
}

// Import routes
const userMetricsRoutes = require('./routes/userMetricsRoutes');
const leadTimeHistoryRoutes = require('./routes/leadTimeHistoryRoutes');
const leadTimesRoutes = require('./routes/leadTimesRoutes');
const deploymentsRoutes = require('./routes/deploymentsRoutes');
const jdbcConfigRoutes = require('./routes/jdbcConfigRoutes');

// Register routes
app.use(userMetricsRoutes);
app.use(leadTimeHistoryRoutes);
app.use(leadTimesRoutes);
app.use(deploymentsRoutes);
app.use(jdbcConfigRoutes);

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
    delete require.cache[require.resolve('./flywayHistory')];
    const flywayHistory = require('./flywayHistory');
    
    let history;
    if (DEMO_MODE) {
      // Demo mode: use mock data to show all platforms
      history = flywayHistory.getMockFlywayHistory();
    } else {
      // Production mode: use real JDBC connections
      history = await flywayHistory.getFlywayHistory();
      // Fallback to empty array if no connections configured
      if (!history || history.length === 0) {
        console.warn('No Flyway history found from JDBC connections');
        history = [];
      }
    }
    
    res.json(Array.isArray(history) ? history : []);
  } catch (e) {
    console.error('Flyway history all error:', e);
    try {
      const flywayHistory = require('./flywayHistory');
      const mockHistory = flywayHistory.getMockFlywayHistory();
      res.json(mockHistory);
    } catch (err) {
      res.json([]);
    }
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Restart server endpoint
app.post('/api/server/restart', (req, res) => {
  res.json({ success: true, message: 'Server restarting...' });
  console.log('Server restart requested via API');
  
  // Give response time to send, then exit
  setTimeout(() => {
    console.log('Restarting server...');
    process.exit(0);
  }, 500);
});

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
