#!/usr/bin/env node

/**
 * Flyway Dashboard Server - Diagnostics Tool
 * 
 * Checks server health and configuration:
 * - Environment variables
 * - Database connectivity
 * - File permissions
 * - Port availability
 */

const fs = require('fs');
const path = require('path');
const net = require('net');
const { Pool } = require('pg');
const sql = require('mssql');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function header(text) {
  console.log('\n' + colorize('='.repeat(60), 'cyan'));
  console.log(colorize(`  ${text}`, 'bright'));
  console.log(colorize('='.repeat(60), 'cyan') + '\n');
}

function success(text) {
  console.log(colorize(`✓ ${text}`, 'green'));
}

function warning(text) {
  console.log(colorize(`⚠ ${text}`, 'yellow'));
}

function error(text) {
  console.log(colorize(`✗ ${text}`, 'red'));
}

function info(text) {
  console.log(colorize(`ℹ ${text}`, 'blue'));
}

// Check if port is available
function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(true);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    
    server.listen(port);
  });
}

// Check environment configuration
async function checkEnvironment() {
  header('Environment Configuration');
  
  const envPath = path.join(__dirname, '.env');
  
  if (!fs.existsSync(envPath)) {
    warning('.env file not found');
    info('Run: node setup-wizard.js to create one');
    return false;
  }
  
  success('.env file exists');
  
  require('dotenv').config();
  
  const requiredVars = ['PORT', 'ALLOWED_ORIGINS'];
  const optionalVars = ['DEMO_MODE', 'JDBC_ENCRYPTION_KEY'];
  
  let allGood = true;
  
  console.log('\n' + colorize('Required Variables:', 'bright'));
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      success(`${varName} = ${process.env[varName]}`);
    } else {
      error(`${varName} is not set`);
      allGood = false;
    }
  }
  
  console.log('\n' + colorize('Optional Variables:', 'bright'));
  for (const varName of optionalVars) {
    if (process.env[varName]) {
      // Don't show full encryption key
      const value = varName === 'JDBC_ENCRYPTION_KEY' 
        ? `${process.env[varName].substring(0, 8)}...` 
        : process.env[varName];
      success(`${varName} = ${value}`);
    } else {
      info(`${varName} is not set`);
    }
  }
  
  return allGood;
}

// Check port availability
async function checkPortAvailability() {
  header('Port Availability');
  
  const port = process.env.PORT || 3001;
  const available = await checkPort(port);
  
  if (available) {
    success(`Port ${port} is available`);
    return true;
  } else {
    error(`Port ${port} is already in use`);
    info('Change PORT in .env or stop the other process');
    return false;
  }
}

// Check JDBC connections
async function checkJdbcConnections() {
  header('JDBC Database Connections');
  
  const jdbcPath = path.join(__dirname, 'jdbc-connections.json');
  
  if (!fs.existsSync(jdbcPath)) {
    warning('jdbc-connections.json not found');
    info('Run: node setup-wizard.js to configure databases');
    return false;
  }
  
  success('jdbc-connections.json exists');
  
  let connections;
  try {
    const data = fs.readFileSync(jdbcPath, 'utf8');
    connections = JSON.parse(data);
  } catch (e) {
    error(`Failed to parse jdbc-connections.json: ${e.message}`);
    return false;
  }
  
  const prodCount = connections.prod?.length || 0;
  const nonProdCount = connections.nonProd?.length || 0;
  
  console.log('');
  info(`Production databases: ${prodCount}`);
  info(`Non-production databases: ${nonProdCount}`);
  
  if (prodCount === 0 && nonProdCount === 0) {
    warning('No database connections configured');
    if (process.env.DEMO_MODE !== 'true') {
      info('Either add connections or enable DEMO_MODE in .env');
    }
  }
  
  // Test connections
  console.log('\n' + colorize('Testing Connections:', 'bright'));
  
  let testedCount = 0;
  let successCount = 0;
  
  for (const jdbcUrl of [...(connections.prod || []), ...(connections.nonProd || [])]) {
    testedCount++;
    const dbName = extractDbName(jdbcUrl);
    
    try {
      if (jdbcUrl.startsWith('jdbc:postgresql://')) {
        await testPostgresConnection(jdbcUrl);
        success(`${dbName} (PostgreSQL)`);
        successCount++;
      } else if (jdbcUrl.startsWith('jdbc:sqlserver://')) {
        await testMssqlConnection(jdbcUrl);
        success(`${dbName} (SQL Server)`);
        successCount++;
      }
    } catch (e) {
      error(`${dbName}: ${e.message}`);
    }
  }
  
  if (testedCount > 0) {
    console.log('');
    info(`${successCount}/${testedCount} connections successful`);
  }
  
  return successCount === testedCount;
}

function extractDbName(jdbcUrl) {
  const pgMatch = jdbcUrl.match(/\/([^/?]+)\??/);
  const mssqlMatch = jdbcUrl.match(/databaseName=([^;]+)/);
  
  if (pgMatch) return pgMatch[1];
  if (mssqlMatch) return mssqlMatch[1];
  return 'unknown';
}

async function testPostgresConnection(jdbcUrl) {
  const urlMatch = jdbcUrl.match(/^jdbc:postgresql:\/\/([^:/]+)(?::(\d+))?\/([^?]+)\??(.*)$/);
  if (!urlMatch) throw new Error('Invalid PostgreSQL URL');
  
  const [, host, port, database, query] = urlMatch;
  let user, password;
  if (query) {
    const params = new URLSearchParams(query);
    user = params.get('user');
    password = params.get('password');
  }
  
  const pool = new Pool({
    host,
    port: port ? parseInt(port) : 5432,
    database,
    user,
    password,
    connectionTimeoutMillis: 5000
  });
  
  try {
    await pool.query('SELECT 1');
    const result = await pool.query('SELECT COUNT(*) FROM flyway_schema_history');
    const count = result.rows[0].count;
    info(`  Found ${count} migrations`);
  } finally {
    await pool.end();
  }
}

async function testMssqlConnection(jdbcUrl) {
  const serverMatch = jdbcUrl.match(/jdbc:sqlserver:\/\/([^:;]+)(?::(\d+))?/);
  const dbMatch = jdbcUrl.match(/databaseName=([^;]+)/);
  const userMatch = jdbcUrl.match(/user=([^;]+)/);
  const passwordMatch = jdbcUrl.match(/password=([^;]+)/);
  
  if (!serverMatch || !dbMatch) throw new Error('Invalid SQL Server URL');
  
  const config = {
    server: serverMatch[1],
    port: serverMatch[2] ? parseInt(serverMatch[2]) : 1433,
    database: dbMatch[1],
    user: userMatch ? userMatch[1] : '',
    password: passwordMatch ? passwordMatch[1] : '',
    options: {
      trustServerCertificate: true,
      encrypt: true,
      connectTimeout: 5000
    }
  };
  
  const pool = await sql.connect(config);
  try {
    await pool.request().query('SELECT 1');
    const result = await pool.request().query('SELECT COUNT(*) FROM flyway_schema_history');
    const count = result.recordset[0][''];
    info(`  Found ${count} migrations`);
  } finally {
    await pool.close();
  }
}

// Check file permissions
async function checkFilePermissions() {
  header('File Permissions');
  
  const files = [
    { path: path.join(__dirname, 'db'), type: 'directory', writable: true },
    { path: path.join(__dirname, '.env'), type: 'file', writable: false },
    { path: path.join(__dirname, 'jdbc-connections.json'), type: 'file', writable: true }
  ];
  
  let allGood = true;
  
  for (const file of files) {
    try {
      if (fs.existsSync(file.path)) {
        fs.accessSync(file.path, fs.constants.R_OK);
        
        if (file.writable) {
          fs.accessSync(file.path, fs.constants.W_OK);
        }
        
        success(`${path.basename(file.path)} - readable${file.writable ? ' & writable' : ''}`);
      } else {
        info(`${path.basename(file.path)} - does not exist (will be created)`);
      }
    } catch (e) {
      error(`${path.basename(file.path)} - permission denied`);
      allGood = false;
    }
  }
  
  return allGood;
}

// Check Node.js version
function checkNodeVersion() {
  header('Runtime Environment');
  
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion >= 16) {
    success(`Node.js ${nodeVersion} (compatible)`);
    return true;
  } else {
    error(`Node.js ${nodeVersion} (requires v16+)`);
    return false;
  }
}

// Main diagnostics
async function runDiagnostics() {
  console.clear();
  
  header('Flyway Dashboard Server - Diagnostics');
  
  const results = {
    node: checkNodeVersion(),
    env: await checkEnvironment(),
    port: await checkPortAvailability(),
    jdbc: await checkJdbcConnections(),
    files: await checkFilePermissions()
  };
  
  // Summary
  header('Diagnostics Summary');
  
  const allPassed = Object.values(results).every(r => r);
  
  if (allPassed) {
    success('All checks passed! Server is ready to start.');
    console.log('');
    info('Start server: npm start');
    info('Development mode: npm run dev');
  } else {
    warning('Some checks failed. Review errors above.');
    console.log('');
    info('Run setup wizard: node setup-wizard.js');
    info('View documentation: README.md');
  }
  
  console.log('');
}

// Run diagnostics
runDiagnostics().catch(console.error);
