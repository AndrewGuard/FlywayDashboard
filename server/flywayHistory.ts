import * as fs from 'fs';
import * as path from 'path';
import * as sql from 'mssql';
import { Pool } from 'pg';
import { dbHelpers } from './db/database';
import { decryptJdbcData, isEncrypted } from './utils/encryption';
import {
  FlywayMigration,
  JdbcConnections,
  PostgresConfig,
  MssqlConfig
} from './types';

const configPath = path.join(__dirname, 'jdbc-connections.json');

// Parse JDBC URL to PostgreSQL config
export function parseJdbcToPgConfig(jdbcUrl: string): PostgresConfig | null {
  const urlMatch = jdbcUrl.match(/^jdbc:postgresql:\/\/([^:/]+)(?::(\d+))?\/([^?]+)\??(.*)$/);
  if (!urlMatch) return null;
  const [, host, port, database, query] = urlMatch;
  let user: string | undefined;
  let password: string | undefined;
  if (query) {
    const params = new URLSearchParams(query);
    user = params.get('user') ?? undefined;
    password = params.get('password') ?? undefined;
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
export function parseJdbcToMssqlConfig(jdbcUrl: string): MssqlConfig | null {
  const serverMatch = jdbcUrl.match(/jdbc:sqlserver:\/\/([^:;]+)(?::(\d+))?/);
  const instanceMatch = jdbcUrl.match(/instanceName=([^;]+)/);
  const dbMatch = jdbcUrl.match(/databaseName=([^;]+)/);
  const userMatch = jdbcUrl.match(/user=([^;]+)/);
  const passwordMatch = jdbcUrl.match(/password=([^;]+)/);
  
  const server = serverMatch ? serverMatch[1] : 'localhost';
  const port = serverMatch && serverMatch[2] ? parseInt(serverMatch[2]) : 1433;
  
  // Note: Named instances can be unreliable in Node.js mssql library
  // Using port-based connection instead for better reliability
  // If instance name is specified but port is 1433, prefer port-based connection
  if (instanceMatch && serverMatch && !serverMatch[2]) {
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

// Load connections from JSON file (with auto-decrypt)
export function loadConnections(): JdbcConnections {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      
      // Check if encrypted
      if (isEncrypted(data)) {
        return decryptJdbcData(data) as JdbcConnections;
      } else {
        return JSON.parse(data) as JdbcConnections;
      }
    }
  } catch (e) {
    const err = e as Error;
    console.error('Error loading jdbc-connections.json:', err.message);
  }
  return { prod: [], nonProd: [] };
}

// Get Flyway history from a single PostgreSQL database
async function getPostgresHistory(config: PostgresConfig, dbName: string, env: string): Promise<FlywayMigration[]> {
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
    })) as FlywayMigration[];
  } catch (e) {
    const err = e as Error;
    console.error(`Error fetching PostgreSQL history from ${dbName}:`, err.message);
    return [];
  } finally {
    await pool.end();
  }
}

// Get Flyway history from a single SQL Server database
async function getMssqlHistory(config: MssqlConfig, dbName: string | undefined, env: string): Promise<FlywayMigration[]> {
  let pool: sql.ConnectionPool | null = null;
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
      database: dbName ?? config.database,
      environment: env,
      dbType: 'SQL Server'
    })) as FlywayMigration[];
  } catch (e) {
    const err = e as Error;
    if (err.message.includes('Failed to connect')) {
      console.error(`✗ Connection failed: ${config.server}\\${config.database} - ${err.message}`);
      console.error(`  Ensure SQL Server instance is running and accessible`);
    } else {
      console.error(`Error fetching SQL Server history from ${dbName}:`, err.message);
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
async function getHistoryFromJdbc(jdbcUrl: string, env: string): Promise<FlywayMigration[]> {
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
export async function getFlywayHistory(): Promise<FlywayMigration[]> {
  const connections = loadConnections();
  const allHistory: FlywayMigration[] = [];

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
  allHistory.sort((a, b) => new Date(b.installed_on).getTime() - new Date(a.installed_on).getTime());

  return allHistory;
}

// Get Flyway history with lead times
export async function getFlywayHistoryWithLeadTimes(): Promise<FlywayMigration[]> {
  try {
    const history = await getFlywayHistory();
    const leadTimesData = dbHelpers.getLeadTimes();
    const leadTimesMap = new Map<string, typeof leadTimesData.leadTimes[0]>();
    
    if (leadTimesData?.leadTimes) {
      leadTimesData.leadTimes.forEach(lt => {
        leadTimesMap.set(lt.script, lt);
      });
    }

    return history.map(m => {
      const leadTime = leadTimesMap.get(m.script);
      return {
        ...m,
        leadTimeDays: leadTime?.leadTimeDays ?? null,
        scriptDate: leadTime?.scriptDate ?? null
      };
    });
  } catch (e) {
    const err = e as Error;
    console.error('Error fetching flyway history with lead times:', err);
    return [];
  }
}

// Get history for production only
export async function getFlywayHistoryProd(): Promise<FlywayMigration[]> {
  const connections = loadConnections();
  const prodHistory: FlywayMigration[] = [];

  for (const jdbcUrl of (connections.prod || [])) {
    const history = await getHistoryFromJdbc(jdbcUrl, 'prod');
    prodHistory.push(...history);
  }

  prodHistory.sort((a, b) => new Date(b.installed_on).getTime() - new Date(a.installed_on).getTime());
  return prodHistory;
}

// Test all connections on startup
export async function testConnections(): Promise<void> {
  const connections = loadConnections();
  console.log('Testing database connections...');
  
  for (const jdbcUrl of [...(connections.prod || []), ...(connections.nonProd || [])]) {
    try {
      if (jdbcUrl.startsWith('jdbc:postgresql://')) {
        const config = parseJdbcToPgConfig(jdbcUrl);
        if (config) {
          const pool = new Pool(config);
          await pool.query('SELECT 1');
          await pool.end();
          console.log(`✓ PostgreSQL connected: ${config.database}`);
        }
      } else if (jdbcUrl.startsWith('jdbc:sqlserver://')) {
        const config = parseJdbcToMssqlConfig(jdbcUrl);
        if (config) {
          const pool = await sql.connect(config);
          await pool.request().query('SELECT 1');
          await pool.close();
          console.log(`✓ SQL Server connected: ${config.database}`);
        }
      }
    } catch (e) {
      const err = e as Error;
      console.error(`✗ Connection failed: ${jdbcUrl.substring(0, 50)}... - ${err.message}`);
    }
  }
}

// Generate mock Flyway history from lead times data
export function getMockFlywayHistory(): FlywayMigration[] {
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
    const err = e as Error;
    console.error('Error generating mock history:', err);
    return [];
  }
}
