const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const sql = require('mssql');
const { Pool } = require('pg');
const { encryptJdbcData, decryptJdbcData, isEncrypted } = require('../utils/encryption');

const configPath = path.join(__dirname, '../jdbc-connections.json');

// Helper to parse JDBC URLs
function parseJdbcToPgConfig(jdbcUrl) {
  const urlMatch = jdbcUrl.match(/^jdbc:postgresql:\/\/([^:/]+)(?::(\d+))?\/([^?]+)\??(.*)$/);
  if (!urlMatch) return null;
  const [, host, port, database, query] = urlMatch;
  let user, password;
  if (query) {
    const params = new URLSearchParams(query);
    user = params.get('user');
    password = params.get('password');
  }
  return {
    host,
    port: port ? parseInt(port) : 5432,
    database,
    user,
    password
  };
}

function parseJdbcToMssqlConfig(jdbcUrl) {
  const serverMatch = jdbcUrl.match(/jdbc:sqlserver:\/\/([^:;]+)(?::(\d+))?/);
  const dbMatch = jdbcUrl.match(/databaseName=([^;]+)/);
  const userMatch = jdbcUrl.match(/user=([^;]+)/);
  const passwordMatch = jdbcUrl.match(/password=([^;]+)/);
  
  let server = serverMatch ? serverMatch[1] : 'localhost';
  let port = serverMatch && serverMatch[2] ? parseInt(serverMatch[2]) : 1433;
  
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
router.get('/api/jdbc-connections/config', (req, res) => {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      
      // Check if data is encrypted
      let config;
      if (isEncrypted(data)) {
        console.log('🔓 Decrypting JDBC connections...');
        config = decryptJdbcData(data);
      } else {
        // Legacy plaintext format
        console.log('⚠️  JDBC connections are stored in plaintext - will encrypt on next save');
        config = JSON.parse(data);
      }
      
      res.json(config);
    } else {
      res.json({ prod: [], nonProd: [] });
    }
  } catch (e) {
    console.error('Error reading JDBC config:', e);
    res.status(500).json({ error: 'Failed to read configuration: ' + e.message });
  }
});

// POST configuration (save with encryption)
router.post('/api/jdbc-connections/config', (req, res) => {
  try {
    const { prod = [], nonProd = [] } = req.body;
    const config = { prod, nonProd };
    
    // Encrypt before saving
    console.log('🔒 Encrypting JDBC connections...');
    const encrypted = encryptJdbcData(config);
    fs.writeFileSync(configPath, encrypted, 'utf8');
    
    // Clear the require cache so next load gets fresh data
    delete require.cache[require.resolve('../flywayHistory')];
    
    res.json({ success: true, message: 'Configuration saved successfully' });
  } catch (e) {
    console.error('Error saving JDBC config:', e);
    res.status(500).json({ error: 'Failed to save configuration' });
  }
});

// POST test connection
router.post('/api/jdbc-connections/test', async (req, res) => {
  const { jdbcUrl } = req.body;
  
  if (!jdbcUrl) {
    return res.status(400).json({ success: false, message: 'JDBC URL is required' });
  }
  
  try {
    if (jdbcUrl.startsWith('jdbc:postgresql://')) {
      const config = parseJdbcToPgConfig(jdbcUrl);
      if (!config) {
        return res.json({ success: false, message: 'Invalid PostgreSQL JDBC URL format' });
      }
      
      const pool = new Pool(config);
      await pool.query('SELECT 1');
      await pool.end();
      
      return res.json({
        success: true,
        message: `Successfully connected to PostgreSQL database: ${config.database}`
      });
    } else if (jdbcUrl.startsWith('jdbc:sqlserver://')) {
      const config = parseJdbcToMssqlConfig(jdbcUrl);
      if (!config.database) {
        return res.json({ success: false, message: 'Database name not found in JDBC URL' });
      }
      
      const pool = await sql.connect(config);
      await pool.request().query('SELECT 1');
      await pool.close();
      
      return res.json({
        success: true,
        message: `Successfully connected to SQL Server database: ${config.database}`
      });
    } else {
      return res.json({
        success: false,
        message: 'Unsupported JDBC URL type. Only PostgreSQL and SQL Server are supported.'
      });
    }
  } catch (e) {
    console.error('Connection test failed:', e);
    return res.json({
      success: false,
      message: e.message || 'Connection test failed'
    });
  }
});

module.exports = router;
