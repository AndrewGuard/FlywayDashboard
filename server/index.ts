// Initialize encryption FIRST (creates .env if needed)
import { initializeEncryption } from './utils/encryption';
const envCreated = initializeEncryption();

// Load environment variables AFTER initialization
import * as dotenv from 'dotenv';
dotenv.config({ override: envCreated });

import express, { Request, Response } from 'express';
import cors from 'cors';
import { execSync } from 'child_process';
import { db } from './db/database';
import * as flywayHistory from './flywayHistory';

// Import routes
import userMetricsRoutes from './routes/userMetricsRoutes';
import leadTimeHistoryRoutes from './routes/leadTimeHistoryRoutes';
import leadTimesRoutes from './routes/leadTimesRoutes';
import deploymentsRoutes from './routes/deploymentsRoutes';
import jdbcConfigRoutes from './routes/jdbcConfigRoutes';

const app = express();

// CORS configuration for production deployments
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    // Allow all origins in development, specific origins in production
    if (process.env.NODE_ENV !== 'production' || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Initialize database
console.log('Database initialized');

// Set DEMO_MODE=true environment variable to use mock data and auto-seed
// For production deployments, leave DEMO_MODE unset or set to false
const DEMO_MODE = process.env.DEMO_MODE === 'true';

if (DEMO_MODE) {
  console.log('🎭 Running in DEMO MODE - using mock data and auto-seeding');
  try {
    const count = db.prepare('SELECT COUNT(*) as count FROM lead_time_history').get() as { count: number };
    if (count.count === 0) {
      console.log('Database is empty, seeding with demo data...');
      execSync('npm run refresh-demo', { stdio: 'inherit', cwd: __dirname });
    } else {
      console.log(`Database has ${count.count} lead time records`);
    }
  } catch (e) {
    const err = e as Error;
    console.log('Could not check/seed database:', err.message);
  }
} else {
  console.log('🚀 Running in PRODUCTION MODE - using real JDBC connections');
}

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'healthy',
    mode: DEMO_MODE ? 'demo' : 'production',
    timestamp: new Date().toISOString()
  });
});

// Register routes
app.use(userMetricsRoutes);
app.use(leadTimeHistoryRoutes);
app.use(leadTimesRoutes);
app.use(deploymentsRoutes);
app.use(jdbcConfigRoutes);

// JDBC Connections endpoint
app.get('/api/jdbc-connections', (_req: Request, res: Response) => {
  try {
    res.json([]);
  } catch (e) {
    const err = e as Error;
    console.error('Get JDBC connections error:', err);
    res.json([]);
  }
});

app.get('/api/jdbc-connections/history', async (_req: Request, res: Response) => {
  try {
    // Return flyway history from database
    const history = await flywayHistory.getFlywayHistory();
    res.json(Array.isArray(history) ? history : []);
  } catch (e) {
    const err = e as Error;
    console.error('Get JDBC connections history error:', err);
    res.json([]);
  }
});

// Flyway history endpoints
app.get('/api/flyway-history', async (_req: Request, res: Response) => {
  try {
    const history = await flywayHistory.getFlywayHistory();
    res.json(Array.isArray(history) ? history : []);
  } catch (e) {
    const err = e as Error;
    console.error('Flyway history error:', err);
    res.json([]);
  }
});

app.get('/api/flyway/history/all', async (_req: Request, res: Response) => {
  try {
    let history: any[];
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
    const err = e as Error;
    console.error('Flyway history all error:', err);
    try {
      const mockHistory = flywayHistory.getMockFlywayHistory();
      res.json(mockHistory);
    } catch (err) {
      res.json([]);
    }
  }
});

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Restart server endpoint
app.post('/api/server/restart', (_req: Request, res: Response) => {
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
