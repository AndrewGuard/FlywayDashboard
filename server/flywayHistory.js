const fs = require('fs');
const path = require('path');
const sql = require('mssql');
const { Client: PgClient } = require('pg');

const configPath = path.join(__dirname, 'jdbc-connections.json');

const { setLeadTime, getLeadTimes } = require('./leadTimeStore');

async function getFlywayHistory() {
  const data = JSON.parse(fs.readFileSync(configPath));
  let connections = [];
  if (Array.isArray(data)) {
    connections = data;
  } else {
    const prod = Array.isArray(data.prod) ? data.prod : [];
    const nonProd = Array.isArray(data.nonProd) ? data.nonProd : [];
    connections = [...prod, ...nonProd];
  }
  const results = [];
  const leadTimes = getLeadTimes();

  for (const connStr of connections) {
    let dbName = 'unknown';
    let history = [];
    let error = null;
    if (/^jdbc:postgresql:/i.test(connStr)) {
      // Parse PostgreSQL JDBC
      const pgConfig = parseJdbcToPgConfig(connStr);
      dbName = pgConfig.database || 'unknown';
      const client = new PgClient(pgConfig);
      try {
        await client.connect();
        const res = await client.query('SELECT * FROM flyway_schema_history ORDER BY installed_rank DESC');
        history = res.rows;
      } catch (err) {
        error = err.message;
      } finally {
        await client.end();
      }
    } else {
      // MSSQL
      const match = connStr.match(/databaseName=([^;]+)/);
      dbName = match ? match[1] : 'unknown2';
      const config = parseJdbcToMssqlConfig(connStr);
      try {
        await sql.connect(config);
        const res = await sql.query('SELECT * FROM flyway_schema_history ORDER BY installed_rank DESC');
        history = res.recordset;
      } catch (err) {
        error = err.message;
      }
      await sql.close();
    }
    // Calculate lead time for each migration
    history = (history || []).map(row => {
      let leadTime = null;
      if (row.installed_on && row.script) {
        // Try to extract timestamp from script name (e.g., V010_20250918120543__desc.sql)
        const match = row.script.match(/_(\d{14})__/);
        if (match) {
          const scriptTs = match[1];
          // Parse as YYYYMMDDHHmmss
          const scriptDate = new Date(
            scriptTs.slice(0,4)+'-'+scriptTs.slice(4,6)+'-'+scriptTs.slice(6,8)+'T'+
            scriptTs.slice(8,10)+':'+scriptTs.slice(10,12)+':'+scriptTs.slice(12,14)+'Z'
          );
          const installedDate = new Date(row.installed_on);
          if (!isNaN(scriptDate) && !isNaN(installedDate)) {
            leadTime = (installedDate - scriptDate) / (1000 * 60 * 60 * 24); // days
            // Store in file by unique key (dbName+version+script)
            const key = `${dbName}|${row.version}|${row.script}`;
            setLeadTime(key, leadTime);
          }
        }
      }
      return { ...row, leadTime };
    });
    results.push({ dbName, connStr, history, ...(error ? { error } : {}) });
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
  console.log("[Flyway] Results: ", JSON.stringify(results, null, 2));
  return results;
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

module.exports = { getFlywayHistory };
