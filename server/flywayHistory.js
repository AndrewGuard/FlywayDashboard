const fs = require('fs');
const path = require('path');
const sql = require('mssql');

const configPath = path.join(__dirname, 'jdbc-connections.json');

async function getFlywayHistory() {
  const connections = JSON.parse(fs.readFileSync(configPath));
  const results = [];

  for (const connStr of connections) {
    // Parse connection string for mssql config
    const match = connStr.match(/databaseName=([^;]+).*?integratedSecurity=true/);
    const dbName = match ? match[1] : 'unknown';
    const config = parseJdbcToMssqlConfig(connStr);
    console.log(`[Flyway] Attempting connection to DB: ${dbName}`);
    console.log(`[Flyway] Connection config:`, JSON.stringify(config, null, 2));
    try {
      await sql.connect(config);
      console.log(`[Flyway] Connected to ${dbName}`);
      const res = await sql.query('SELECT * FROM flyway_schema_history ORDER BY installed_rank DESC');
      results.push({ dbName, history: res.recordset });
    } catch (err) {
      console.error(`[Flyway] Error connecting to ${dbName}:`, err);
      results.push({ dbName, error: err.message });
    }
    await sql.close();
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
