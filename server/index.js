require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

// Initialize database
const { db, dbHelpers } = require('./db/database');
console.log('Database initialized');

// Auto-seed database if empty
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
