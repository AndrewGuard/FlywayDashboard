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
    try {
      await sql.connect(config);
      const res = await sql.query('SELECT * FROM flyway_schema_history ORDER BY installed_rank DESC');
      results.push({ dbName, history: res.recordset });
    } catch (err) {
      results.push({ dbName, error: err.message });
    }
    await sql.close();
  }
  console.log("Results: ", JSON.stringify(results, null, 2));
  return results;
}

function parseJdbcToMssqlConfig(jdbcUrl) {
  // Only supports integratedSecurity=true and trustServerCertificate=true
  const serverMatch = jdbcUrl.match(/jdbc:sqlserver:\/\/(.*?):(\d+);/);
  const dbMatch = jdbcUrl.match(/databaseName=([^;]+)/);
  return {
    server: serverMatch ? serverMatch[1].replace('\\', '\\') : 'localhost',
    port: serverMatch ? parseInt(serverMatch[2]) : 1433,
    database: dbMatch ? dbMatch[1] : undefined,
    options: {
      trustServerCertificate: true,
      encrypt: true
    },
    authentication: {
      type: 'ntlm',
      options: {
        domain: process.env.USERDOMAIN || undefined,
        userName: process.env.USERNAME || undefined,
        password: process.env.USERPWD || undefined
      }
    }
  };
}

module.exports = { getFlywayHistory };
