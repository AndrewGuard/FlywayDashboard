const fs = require('fs');
const path = require('path');
const sql = require('mssql');
const { Pool } = require('pg');
const { dbHelpers } = require('./db/database');

const configPath = path.join(__dirname, 'jdbc-connections.json');

// PostgreSQL connection for Flyway schema history
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'pagila_test',
  user: 'postgres',
  password: 'password'
});

// Test connection on startup
pool.query('SELECT 1')
  .then(() => console.log('PostgreSQL connected successfully'))
  .catch(e => console.error('PostgreSQL connection failed:', e.message));

async function getFlywayHistory() {
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
    return result.rows;
  } catch (e) {
    console.error('Error fetching flyway history:', e.message);
    return [];
  }
}

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

function parseJdbcToPgConfig(jdbcUrl) {
  // Example: jdbc:postgresql://localhost:5432/db?user=postgres&password=pass
  const urlMatch = jdbcUrl.match(/^jdbc:postgresql:\/\/([^:/]+)(?::(\d+))?\/([^?]+)\??(.*)$/);
  if (!urlMatch) return {};
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
  // Supports SQL authentication via user and password in the JDBC string
  const serverMatch = jdbcUrl.match(/jdbc:sqlserver:\/\/(.*?):(\d+);/);
  const dbMatch = jdbcUrl.match(/databaseName=([^;]+)/);
  const userMatch = jdbcUrl.match(/user=([^;]+)/);
  const passwordMatch = jdbcUrl.match(/password=([^;]+)/);
  const user = userMatch ? userMatch[1] : process.env.DBUSER;
  const password = passwordMatch ? passwordMatch[1] : process.env.DBPWD;
  if (!user || !password) {
    console.error('[Flyway] SQL authentication requires user and password in the JDBC string or DBUSER/DBPWD env vars.');
  }
  return {
    server: serverMatch ? serverMatch[1].replace('\\', '\\') : 'localhost',
    port: serverMatch ? parseInt(serverMatch[2]) : 1433,
    database: dbMatch ? dbMatch[1] : undefined,
    user: user || '',
    password: password || '',
    options: {
      trustServerCertificate: true,
      encrypt: true
    }
  };
}

module.exports = { 
  getFlywayHistory, 
  getFlywayHistoryWithLeadTimes,
  parseJdbcToPgConfig,
  parseJdbcToMssqlConfig,
  pool 
};
