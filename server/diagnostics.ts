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

import * as fs from 'fs';
import * as path from 'path';
import * as net from 'net';
import { Pool } from 'pg';
import * as sql from 'mssql';
import * as dotenv from 'dotenv';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m'
};

function colorize(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`;
}

function header(text: string): void {
  console.log('\n' + colorize('='.repeat(60), 'cyan'));
  console.log(colorize(`  ${text}`, 'bright'));
  console.log(colorize('='.repeat(60), 'cyan') + '\n');
}

function success(text: string): void {
  console.log(colorize(`✓ ${text}`, 'green'));
}

function warning(text: string): void {
  console.log(colorize(`⚠ ${text}`, 'yellow'));
}

function error(text: string): void {
  console.log(colorize(`✗ ${text}`, 'red'));
}

function info(text: string): void {
  console.log(colorize(`ℹ ${text}`, 'blue'));
}

// Check if port is available
function checkPort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err: NodeJS.ErrnoException) => {
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
async function checkEnvironment(): Promise<boolean> {
  header('Environment Configuration');
  
  const envPath = path.join(__dirname, '.env');
  
  if (!fs.existsSync(envPath)) {
    warning('.env file not found');
    info('Run: node setup-wizard.js to create one');
    return false;
  }
  
  success('.env file exists');
  
  dotenv.config();
  
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
        ? `${process.env[varName]!.substring(0, 8)}...` 
        : process.env[varName];
      success(`${varName} = ${value}`);
    } else {
      info(`${varName} is not set`);
    }
  }
  
  return allGood;
}

// Check port availability
async function checkPortAvailability(): Promise<boolean> {
  header('Port Availability');
  
  const port = parseInt(process.env.PORT || '3001');
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

// Extract database name from JDBC URL
function extractDbName(jdbcUrl: string): string {
  if (jdbcUrl.startsWith('jdbc:postgresql://')) {
    const match = jdbcUrl.match(/\/([^?]+)/);
    return match ? match[1] : 'Unknown';
  } else if (jdbcUrl.startsWith('jdbc:sqlserver://')) {
    const match = jdbcUrl.match(/databaseName=([^;]+)/);
    return match ? match[1] : 'Unknown';
  }
  return 'Unknown';
}

// Test PostgreSQL connection
async function testPostgresConnection(jdbcUrl: string): Promise<void> {
  const urlMatch = jdbcUrl.match(/^jdbc:postgresql:\/\/([^:/]+)(?::(\d+))?\/([^?]+)\??(.*)$/);
  if (!urlMatch) throw new Error('Invalid PostgreSQL JDBC URL');
  
  const [, host, port, database, query] = urlMatch;
  let user: string | undefined;
  let password: string | undefined;
  
  if (query) {
    const params = new URLSearchParams(query);
    user = params.get('user') ?? undefined;
    password = params.get('password') ?? undefined;
  }
  
  const pool = new Pool({
    host,
    port: port ? parseInt(port) : 5432,
    database,
    user,
    password
  });
  
  try {
    await pool.query('SELECT 1');
    await pool.end();
  } catch (e) {
    await pool.end();
    throw e;
  }
}

// Test SQL Server connection
async function testMssqlConnection(jdbcUrl: string): Promise<void> {
  const serverMatch = jdbcUrl.match(/jdbc:sqlserver:\/\/([^:;]+)(?::(\d+))?/);
  const dbMatch = jdbcUrl.match(/databaseName=([^;]+)/);
  const userMatch = jdbcUrl.match(/user=([^;]+)/);
  const passwordMatch = jdbcUrl.match(/password=([^;]+)/);
  
  if (!serverMatch || !dbMatch) throw new Error('Invalid SQL Server JDBC URL');
  
  const config: sql.config = {
    server: serverMatch[1],
    port: serverMatch[2] ? parseInt(serverMatch[2]) : 1433,
    database: dbMatch[1],
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
  
  const pool = await sql.connect(config);
  try {
    await pool.request().query('SELECT 1');
    await pool.close();
  } catch (e) {
    await pool.close();
    throw e;
  }
}

// Check JDBC connections
async function checkJdbcConnections(): Promise<boolean> {
  header('JDBC Database Connections');
  
  const jdbcPath = path.join(__dirname, 'jdbc-connections.json');
  
  if (!fs.existsSync(jdbcPath)) {
    warning('jdbc-connections.json not found');
    info('Run: node setup-wizard.js to configure databases');
    return false;
  }
  
  success('jdbc-connections.json exists');
  
  let connections: { prod?: string[]; nonProd?: string[] };
  try {
    const data = fs.readFileSync(jdbcPath, 'utf8');
    connections = JSON.parse(data);
  } catch (e) {
    const err = e as Error;
    error(`Failed to parse jdbc-connections.json: ${err.message}`);
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
      const err = e as Error;
      error(`${dbName}: ${err.message}`);
    }
  }
  
  console.log('');
  if (successCount === testedCount && testedCount > 0) {
    success(`All ${testedCount} connections successful`);
    return true;
  } else if (testedCount > 0) {
    warning(`${successCount}/${testedCount} connections successful`);
    return false;
  }
  
  return true;
}

// Main diagnostics
async function runDiagnostics(): Promise<void> {
  console.log(colorize('\n🔍 Flyway Dashboard Server Diagnostics\n', 'bright'));
  
  const results = {
    environment: await checkEnvironment(),
    port: await checkPortAvailability(),
    jdbc: await checkJdbcConnections()
  };
  
  header('Summary');
  
  if (results.environment && results.port && results.jdbc) {
    success('All checks passed! Server is ready to start.');
    info('Run: npm start');
  } else {
    error('Some checks failed. Please review the errors above.');
    if (!results.environment) {
      info('- Fix environment configuration');
    }
    if (!results.port) {
      info('- Free up or change the server port');
    }
    if (!results.jdbc) {
      info('- Configure or fix database connections');
    }
  }
  
  console.log('');
}

// Run diagnostics
runDiagnostics().catch((e) => {
  console.error('Diagnostics failed:', e);
  process.exit(1);
});
