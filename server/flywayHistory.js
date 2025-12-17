const fs = require('fs');
const path = require('path');
const sql = require('mssql');
const { Pool } = require('pg');
const { dbHelpers } = require('./db/database');

const configPath = path.join(__dirname, 'jdbc-connections.json');

// Parse JDBC URL to PostgreSQL config
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

// Parse JDBC URL to SQL Server config
function parseJdbcToMssqlConfig(jdbcUrl) {
  const serverMatch = jdbcUrl.match(/jdbc:sqlserver:\/\/([^:;]+)(?::(\d+))?/);
  const instanceMatch = jdbcUrl.match(/instanceName=([^;]+)/);
  const dbMatch = jdbcUrl.match(/databaseName=([^;]+)/);
  const userMatch = jdbcUrl.match(/user=([^;]+)/);
  const passwordMatch = jdbcUrl.match(/password=([^;]+)/);
  
  let server = serverMatch ? serverMatch[1] : 'localhost';
  let port = serverMatch && serverMatch[2] ? parseInt(serverMatch[2]) : 1433;
  
  // Note: Named instances can be unreliable in Node.js mssql library
  // Using port-based connection instead for better reliability
  // If instance name is specified but port is 1433, prefer port-based connection
  if (instanceMatch && !serverMatch[2]) {
    console.log(`Note: Using port ${port} instead of named instance ${instanceMatch[1]} for better connection reliability`);
  }
  
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
      connectTimeout: 5000,        // 5 second connection timeout
      requestTimeout: 10000         // 10 second query timeout
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    }
  };
}

// Load connections from JSON file
function loadConnections() {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error loading jdbc-connections.json:', e.message);
  }
  return { prod: [], nonProd: [] };
}

// Get Flyway history from a single PostgreSQL database
async function getPostgresHistory(config, dbName, env) {
  const pool = new Pool(config);
  try {
    const result = await pool.query(`
      SELECT 
        installed_rank,
        version,
        description,
        type,
        script,
        checksum,
        installed_by,
        installed_on,
        execution_time,
        success
      FROM flyway_schema_history
      ORDER BY installed_rank DESC
    `);
    return result.rows.map(row => ({
      ...row,
      database: dbName,
      environment: env,
      dbType: 'PostgreSQL'
    }));
  } catch (e) {
    console.error(`Error fetching PostgreSQL history from ${dbName}:`, e.message);
    return [];
  } finally {
    await pool.end();
  }
}

// Get Flyway history from a single SQL Server database
async function getMssqlHistory(config, dbName, env) {
  let pool = null;
  try {
    console.log(`Attempting to connect to SQL Server: ${config.server}\\${config.database}`);
    pool = await sql.connect(config);
    console.log(`✓ Connected to ${config.server}\\${config.database}`);
    
    const result = await pool.request().query(`
      SELECT 
        installed_rank,
        version,
        description,
        type,
        script,
        checksum,
        installed_by,
        installed_on,
        execution_time,
        success
      FROM flyway_schema_history
      ORDER BY installed_rank DESC
    `);
    return result.recordset.map(row => ({
      ...row,
      database: dbName,
      environment: env,
      dbType: 'SQL Server'
    }));
  } catch (e) {
    if (e.message.includes('Failed to connect')) {
      console.error(`✗ Connection failed: ${config.server}\\${config.database} - ${e.message}`);
      console.error(`  Ensure SQL Server instance is running and accessible`);
    } else {
      console.error(`Error fetching SQL Server history from ${dbName}:`, e.message);
    }
    return [];
  } finally {
    if (pool) {
      try {
        await pool.close();
      } catch (e) {
        // Ignore close errors
      }
    }
  }
}

// Get history from a single JDBC connection
async function getHistoryFromJdbc(jdbcUrl, env) {
  if (jdbcUrl.startsWith('jdbc:postgresql://')) {
    const config = parseJdbcToPgConfig(jdbcUrl);
    if (config) {
      return await getPostgresHistory(config, config.database, env);
    }
  } else if (jdbcUrl.startsWith('jdbc:sqlserver://')) {
    const config = parseJdbcToMssqlConfig(jdbcUrl);
    if (config) {
      return await getMssqlHistory(config, config.database, env);
    }
  }
  return [];
}

// Get Flyway history from all configured connections
async function getFlywayHistory() {
  const connections = loadConnections();
  const allHistory = [];

  // Process production connections
  for (const jdbcUrl of (connections.prod || [])) {
    const history = await getHistoryFromJdbc(jdbcUrl, 'prod');
    allHistory.push(...history);
  }

  // Process non-production connections
  for (const jdbcUrl of (connections.nonProd || [])) {
    const history = await getHistoryFromJdbc(jdbcUrl, 'nonProd');
    allHistory.push(...history);
  }

  // Sort by installed_on descending
  allHistory.sort((a, b) => new Date(b.installed_on) - new Date(a.installed_on));

  return allHistory;
}

// Get Flyway history with lead times
async function getFlywayHistoryWithLeadTimes() {
  try {
    const history = await getFlywayHistory();
    const leadTimesData = dbHelpers.getLeadTimes();
    const leadTimesMap = new Map();
    
    if (leadTimesData?.leadTimes) {
      leadTimesData.leadTimes.forEach(lt => {
        leadTimesMap.set(lt.script, lt);
      });
    }

    return history.map(m => {
      const leadTime = leadTimesMap.get(m.script);
      return {
        ...m,
        leadTimeDays: leadTime?.leadTimeDays || null,
        scriptDate: leadTime?.scriptDate || null
      };
    });
  } catch (e) {
    console.error('Error fetching flyway history with lead times:', e);
    return [];
  }
}

// Get history for production only
async function getFlywayHistoryProd() {
  const connections = loadConnections();
  const prodHistory = [];

  for (const jdbcUrl of (connections.prod || [])) {
    const history = await getHistoryFromJdbc(jdbcUrl, 'prod');
    prodHistory.push(...history);
  }

  prodHistory.sort((a, b) => new Date(b.installed_on) - new Date(a.installed_on));
  return prodHistory;
}

// Test all connections on startup
async function testConnections() {
  const connections = loadConnections();
  console.log('Testing database connections...');
  
  for (const jdbcUrl of [...(connections.prod || []), ...(connections.nonProd || [])]) {
    try {
      if (jdbcUrl.startsWith('jdbc:postgresql://')) {
        const config = parseJdbcToPgConfig(jdbcUrl);
        const pool = new Pool(config);
        await pool.query('SELECT 1');
        await pool.end();
        console.log(`✓ PostgreSQL connected: ${config.database}`);
      } else if (jdbcUrl.startsWith('jdbc:sqlserver://')) {
        const config = parseJdbcToMssqlConfig(jdbcUrl);
        const pool = await sql.connect(config);
        await pool.request().query('SELECT 1');
        await pool.close();
        console.log(`✓ SQL Server connected: ${config.database}`);
      }
    } catch (e) {
      console.error(`✗ Connection failed: ${jdbcUrl.substring(0, 50)}... - ${e.message}`);
    }
  }
}

// Generate mock Flyway history from lead times data
function getMockFlywayHistory() {
  try {
    const leadTimes = dbHelpers.getLeadTimes();
    if (!leadTimes?.leadTimes) return [];
    
    return leadTimes.leadTimes.map((lt, index) => ({
      installed_rank: index + 1,
      version: lt.version || `${index + 1}.0`,
      description: lt.script?.replace(/\.sql$/, '').replace(/^V\d+_\d+__/, '').replace(/_/g, ' ') || `Migration ${index + 1}`,
      type: 'SQL',
      script: lt.script || `V${index + 1}__migration.sql`,
      checksum: null,
      installed_by: 'flyway',
      installed_on: lt.deployDate || new Date().toISOString(),
      installedOn: lt.deployDate || new Date().toISOString(),
      execution_time: Math.floor(Math.random() * 5000) + 100,
      success: true,
      database: lt.database || 'demo_db',
      environment: lt.environment || 'prod',
      dbType: lt.dbType || 'Other'
    }));
  } catch (e) {
    console.error('Error generating mock history:', e);
    return [];
  }
}

// Test connections on module load (commented out - causing crashes)
// testConnections();

module.exports = { 
  getFlywayHistory, 
  getFlywayHistoryWithLeadTimes,
  getFlywayHistoryProd,
  getMockFlywayHistory,
  parseJdbcToPgConfig,
  parseJdbcToMssqlConfig,
  loadConnections,
  testConnections
};
