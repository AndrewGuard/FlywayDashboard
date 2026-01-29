import { Router, Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as sql from 'mssql';
import { Pool } from 'pg';
import { encryptJdbcData, decryptJdbcData, isEncrypted } from '../utils/encryption';
import { PostgresConfig, MssqlConfig, JdbcConnections, ConnectionTestResult } from '../types';

const router = Router();
const configPath = path.join(__dirname, '../jdbc-connections.json');

// Helper to parse JDBC URLs
function parseJdbcToPgConfig(jdbcUrl: string): PostgresConfig | null {
  const urlMatch = jdbcUrl.match(/^jdbc:postgresql:\/\/([^:/]+)(?::(\d+))?\/([^?]+)\??(.*)$/);
  if (!urlMatch) return null;
  const [, host, port, database, query] = urlMatch;
  let user: string | undefined;
  let password: string | undefined;
  if (query) {
    const params = new URLSearchParams(query);
    user = params.get('user') ?? undefined;
    password = params.get('password') ?? undefined;
  }
  return {
    host,
    port: port ? parseInt(port) : 5432,
    database,
    user,
    password
  };
}

function parseJdbcToMssqlConfig(jdbcUrl: string): MssqlConfig | null {
  const serverMatch = jdbcUrl.match(/jdbc:sqlserver:\/\/([^:;]+)(?::(\d+))?/);
  const dbMatch = jdbcUrl.match(/databaseName=([^;]+)/);
  const userMatch = jdbcUrl.match(/user=([^;]+)/);
  const passwordMatch = jdbcUrl.match(/password=([^;]+)/);
  
  const server = serverMatch ? serverMatch[1] : 'localhost';
  const port = serverMatch && serverMatch[2] ? parseInt(serverMatch[2]) : 1433;
  
  return {
    server,
    port,
    database: dbMatch ? dbMatch[1] : undefined,
    user: userMatch ? userMatch[1] : '',
    password: passwordMatch ? passwordMatch[1] : '',
    options: {
      trustServerCertificate: true,
      encrypt: true,
      enableArithAbort: true,
      connectTimeout: 5000,
      requestTimeout: 10000
    }
  };
}

// GET configuration (auto-decrypt)
router.get('/api/jdbc-connections/config', (_req: Request, res: Response) => {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      
      // Check if data is encrypted
      let config: JdbcConnections;
      if (isEncrypted(data)) {
        console.log('🔓 Decrypting JDBC connections...');
        config = decryptJdbcData(data) as JdbcConnections;
      } else {
        // Legacy plaintext format
        console.log('⚠️  JDBC connections are stored in plaintext - will encrypt on next save');
        config = JSON.parse(data) as JdbcConnections;
      }
      
      res.json(config);
    } else {
      res.json({ prod: [], nonProd: [] });
    }
  } catch (e) {
    const err = e as Error;
    console.error('Error reading JDBC config:', err);
    res.status(500).json({ error: 'Failed to read configuration: ' + err.message });
  }
});

// POST configuration (save with encryption)
router.post('/api/jdbc-connections/config', (req: Request, res: Response) => {
  try {
    const { prod = [], nonProd = [] } = req.body;
    const config: JdbcConnections = { prod, nonProd };
    
    // Encrypt before saving
    console.log('🔒 Encrypting JDBC connections...');
    const encrypted = encryptJdbcData(config);
    fs.writeFileSync(configPath, encrypted, 'utf8');
    
    // Clear the require cache so next load gets fresh data
    delete require.cache[require.resolve('../flywayHistory')];
    
    res.json({ success: true, message: 'Configuration saved successfully' });
  } catch (e) {
    const err = e as Error;
    console.error('Error saving JDBC config:', err);
    res.status(500).json({ error: 'Failed to save configuration' });
  }
});

// POST test connection
router.post('/api/jdbc-connections/test', async (req: Request, res: Response) => {
  const { jdbcUrl } = req.body;
  
  if (!jdbcUrl) {
    return res.status(400).json({ success: false, message: 'JDBC URL is required' } as ConnectionTestResult);
  }
  
  try {
    if (jdbcUrl.startsWith('jdbc:postgresql://')) {
      const config = parseJdbcToPgConfig(jdbcUrl);
      if (!config) {
        return res.json({ success: false, message: 'Invalid PostgreSQL JDBC URL format' } as ConnectionTestResult);
      }
      
      const pool = new Pool(config);
      await pool.query('SELECT 1');
      await pool.end();
      
      return res.json({
        success: true,
        message: `Successfully connected to PostgreSQL database: ${config.database}`
      } as ConnectionTestResult);
    } else if (jdbcUrl.startsWith('jdbc:sqlserver://')) {
      const config = parseJdbcToMssqlConfig(jdbcUrl);
      if (!config || !config.database) {
        return res.json({ success: false, message: 'Database name not found in JDBC URL' } as ConnectionTestResult);
      }
      
      const pool = await sql.connect(config);
      await pool.request().query('SELECT 1');
      await pool.close();
      
      return res.json({
        success: true,
        message: `Successfully connected to SQL Server database: ${config.database}`
      } as ConnectionTestResult);
    } else {
      return res.json({
        success: false,
        message: 'Unsupported JDBC URL type. Only PostgreSQL and SQL Server are supported.'
      } as ConnectionTestResult);
    }
  } catch (e) {
    const err = e as Error;
    console.error('Connection test failed:', err);
    return res.json({
      success: false,
      message: err.message || 'Connection test failed'
    } as ConnectionTestResult);
  }
});

export default router;
