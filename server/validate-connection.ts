#!/usr/bin/env node

/**
 * Quick JDBC Connection Validator
 * 
 * Usage:
 *   ts-node validate-connection.ts "jdbc:postgresql://localhost:5432/mydb?user=user&password=pass"
 *   ts-node validate-connection.ts "jdbc:sqlserver://localhost:1433;databaseName=mydb;user=sa;password=pass"
 */

import { Pool } from 'pg';
import * as sql from 'mssql';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function success(text: string): void {
  console.log(`${colors.green}✓ ${text}${colors.reset}`);
}

function error(text: string): void {
  console.log(`${colors.red}✗ ${text}${colors.reset}`);
}

function info(text: string): void {
  console.log(`${colors.cyan}ℹ ${text}${colors.reset}`);
}

async function validatePostgres(jdbcUrl: string): Promise<boolean> {
  const urlMatch = jdbcUrl.match(/^jdbc:postgresql:\/\/([^:/]+)(?::(\d+))?\/([^?]+)\??(.*)$/);
  
  if (!urlMatch) {
    error('Invalid PostgreSQL JDBC URL format');
    info('Expected: jdbc:postgresql://host:port/database?user=username&password=password');
    return false;
  }
  
  const [, host, port, database, query] = urlMatch;
  let user: string | undefined;
  let password: string | undefined;
  
  if (query) {
    const params = new URLSearchParams(query);
    user = params.get('user') ?? undefined;
    password = params.get('password') ?? undefined;
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
    const err = e as any;
    error(`Connection failed: ${err.message}`);
    
    if (err.code === 'ECONNREFUSED') {
      info('Database server is not running or not accessible');
    } else if (err.code === '28P01') {
      info('Authentication failed - check username and password');
    } else if (err.code === '3D000') {
      info('Database does not exist');
    }
    
    await pool.end();
    return false;
  }
}

async function validateMssql(jdbcUrl: string): Promise<boolean> {
  const serverMatch = jdbcUrl.match(/jdbc:sqlserver:\/\/([^:;]+)(?::(\d+))?/);
  const dbMatch = jdbcUrl.match(/databaseName=([^;]+)/);
  const userMatch = jdbcUrl.match(/user=([^;]+)/);
  const passwordMatch = jdbcUrl.match(/password=([^;]+)/);
  
  if (!serverMatch || !dbMatch) {
    error('Invalid SQL Server JDBC URL format');
    info('Expected: jdbc:sqlserver://host:port;databaseName=db;user=user;password=pass');
    return false;
  }
  
  info(`Connecting to SQL Server...`);
  info(`  Server: ${serverMatch[1]}`);
  info(`  Port: ${serverMatch[2] || 1433}`);
  info(`  Database: ${dbMatch[1]}`);
  info(`  User: ${userMatch ? userMatch[1] : 'not specified'}`);
  
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
      connectTimeout: 10000,
      requestTimeout: 10000
    }
  };
  
  try {
    const pool = await sql.connect(config);
    
    // Test basic connection
    await pool.request().query('SELECT 1 as test');
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
    const err = e as any;
    error(`Connection failed: ${err.message}`);
    
    if (err.code === 'ECONNREFUSED') {
      info('Database server is not running or not accessible');
    } else if (err.code === 'ELOGIN') {
      info('Authentication failed - check username and password');
    }
    
    return false;
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: ts-node validate-connection.ts <JDBC_URL>');
    console.log('\nExamples:');
    console.log('  PostgreSQL:');
    console.log('    ts-node validate-connection.ts "jdbc:postgresql://localhost:5432/mydb?user=user&password=pass"');
    console.log('  SQL Server:');
    console.log('    ts-node validate-connection.ts "jdbc:sqlserver://localhost:1433;databaseName=mydb;user=sa;password=pass"');
    process.exit(1);
  }
  
  const jdbcUrl = args[0];
  
  console.log('\n=== JDBC Connection Validator ===\n');
  
  let result = false;
  
  if (jdbcUrl.startsWith('jdbc:postgresql://')) {
    result = await validatePostgres(jdbcUrl);
  } else if (jdbcUrl.startsWith('jdbc:sqlserver://')) {
    result = await validateMssql(jdbcUrl);
  } else {
    error('Unsupported JDBC URL type');
    info('Only PostgreSQL and SQL Server are supported');
    process.exit(1);
  }
  
  console.log('');
  process.exit(result ? 0 : 1);
}

main();
