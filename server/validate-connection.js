#!/usr/bin/env node

/**
 * Quick JDBC Connection Validator
 * 
 * Usage:
 *   node validate-connection.js "jdbc:postgresql://localhost:5432/mydb?user=user&password=pass"
 *   node validate-connection.js "jdbc:sqlserver://localhost:1433;databaseName=mydb;user=sa;password=pass"
 */

const { Pool } = require('pg');
const sql = require('mssql');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function success(text) {
  console.log(`${colors.green}✓ ${text}${colors.reset}`);
}

function error(text) {
  console.log(`${colors.red}✗ ${text}${colors.reset}`);
}

function info(text) {
  console.log(`${colors.cyan}ℹ ${text}${colors.reset}`);
}

async function validatePostgres(jdbcUrl) {
  const urlMatch = jdbcUrl.match(/^jdbc:postgresql:\/\/([^:/]+)(?::(\d+))?\/([^?]+)\??(.*)$/);
  
  if (!urlMatch) {
    error('Invalid PostgreSQL JDBC URL format');
    info('Expected: jdbc:postgresql://host:port/database?user=username&password=password');
    return false;
  }
  
  const [, host, port, database, query] = urlMatch;
  let user, password;
  
  if (query) {
    const params = new URLSearchParams(query);
    user = params.get('user');
    password = params.get('password');
  }
  
  info(`Connecting to PostgreSQL...`);
  info(`  Host: ${host}`);
  info(`  Port: ${port || 5432}`);
  info(`  Database: ${database}`);
  info(`  User: ${user || 'not specified'}`);
  
  const pool = new Pool({
    host,
    port: port ? parseInt(port) : 5432,
    database,
    user,
    password,
    connectionTimeoutMillis: 10000
  });
  
  try {
    // Test basic connection
    await pool.query('SELECT 1 as test');
    success('Database connection successful');
    
    // Test Flyway table
    const result = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name = 'flyway_schema_history'
    `);
    
    if (result.rows[0].count > 0) {
      const migrations = await pool.query('SELECT COUNT(*) as count FROM flyway_schema_history');
      success(`Found flyway_schema_history table with ${migrations.rows[0].count} migrations`);
    } else {
      error('flyway_schema_history table not found');
      info('Make sure Flyway has been run on this database');
    }
    
    await pool.end();
    return true;
  } catch (e) {
    error(`Connection failed: ${e.message}`);
    
    if (e.code === 'ECONNREFUSED') {
      info('Database server is not running or not accessible');
    } else if (e.code === '28P01') {
      info('Authentication failed - check username and password');
    } else if (e.code === '3D000') {
      info('Database does not exist');
    }
    
    await pool.end();
    return false;
  }
}

async function validateMssql(jdbcUrl) {
  const serverMatch = jdbcUrl.match(/jdbc:sqlserver:\/\/([^:;]+)(?::(\d+))?/);
  const dbMatch = jdbcUrl.match(/databaseName=([^;]+)/);
  const userMatch = jdbcUrl.match(/user=([^;]+)/);
  const passwordMatch = jdbcUrl.match(/password=([^;]+)/);
  
  if (!serverMatch || !dbMatch) {
    error('Invalid SQL Server JDBC URL format');
    info('Expected: jdbc:sqlserver://host:port;databaseName=db;user=user;password=pass');
    return false;
  }
  
  const server = serverMatch[1];
  const port = serverMatch[2] ? parseInt(serverMatch[2]) : 1433;
  const database = dbMatch[1];
  const user = userMatch ? userMatch[1] : '';
  const password = passwordMatch ? passwordMatch[1] : '';
  
  info(`Connecting to SQL Server...`);
  info(`  Host: ${server}`);
  info(`  Port: ${port}`);
  info(`  Database: ${database}`);
  info(`  User: ${user || 'not specified'}`);
  
  const config = {
    server,
    port,
    database,
    user,
    password,
    options: {
      trustServerCertificate: true,
      encrypt: true,
      enableArithAbort: true,
      connectTimeout: 10000,
      requestTimeout: 10000
    }
  };
  
  try {
    const pool = await sql.connect(config);
    success('Database connection successful');
    
    // Test Flyway table
    const result = await pool.request().query(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'flyway_schema_history'
    `);
    
    if (result.recordset[0].count > 0) {
      const migrations = await pool.request().query('SELECT COUNT(*) as count FROM flyway_schema_history');
      success(`Found flyway_schema_history table with ${migrations.recordset[0].count} migrations`);
    } else {
      error('flyway_schema_history table not found');
      info('Make sure Flyway has been run on this database');
    }
    
    await pool.close();
    return true;
  } catch (e) {
    error(`Connection failed: ${e.message}`);
    
    if (e.code === 'ESOCKET') {
      info('Cannot reach database server - check host/port and firewall');
    } else if (e.code === 'ELOGIN') {
      info('Authentication failed - check username and password');
    }
    
    return false;
  }
}

async function main() {
  const jdbcUrl = process.argv[2];
  
  if (!jdbcUrl) {
    console.log('Usage: node validate-connection.js "jdbc:....."');
    console.log('');
    console.log('Examples:');
    console.log('  PostgreSQL:');
    console.log('    node validate-connection.js "jdbc:postgresql://localhost:5432/mydb?user=postgres&password=secret"');
    console.log('');
    console.log('  SQL Server:');
    console.log('    node validate-connection.js "jdbc:sqlserver://localhost:1433;databaseName=mydb;user=sa;password=secret"');
    process.exit(1);
  }
  
  console.log('');
  info(`Validating: ${jdbcUrl.substring(0, 50)}...`);
  console.log('');
  
  let success = false;
  
  if (jdbcUrl.startsWith('jdbc:postgresql://')) {
    success = await validatePostgres(jdbcUrl);
  } else if (jdbcUrl.startsWith('jdbc:sqlserver://')) {
    success = await validateMssql(jdbcUrl);
  } else {
    error('Unsupported database type');
    info('Currently supported: PostgreSQL, SQL Server');
    process.exit(1);
  }
  
  console.log('');
  process.exit(success ? 0 : 1);
}

main().catch(e => {
  error(`Unexpected error: ${e.message}`);
  console.error(e);
  process.exit(1);
});
