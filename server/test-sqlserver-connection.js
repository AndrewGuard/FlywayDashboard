const sql = require('mssql');

// Test different SQL Server configurations
const configurations = [
  {
    name: 'SQL Server Express with Named Instance',
    config: {
      server: 'localhost\\sqlexpress',
      database: 'northwind_test',
      user: 'Andrew',
      password: 'foo',
      options: {
        trustServerCertificate: true,
        encrypt: true,
        enableArithAbort: true,
        connectTimeout: 5000,
        requestTimeout: 10000
      }
    }
  },
  {
    name: 'SQL Server Express with Port',
    config: {
      server: 'localhost',
      port: 1433,
      database: 'northwind_test',
      user: 'Andrew',
      password: 'foo',
      options: {
        trustServerCertificate: true,
        encrypt: true,
        enableArithAbort: true,
        connectTimeout: 5000,
        requestTimeout: 10000
      }
    }
  },
  {
    name: 'SQL Server Express with Windows Authentication',
    config: {
      server: 'localhost\\sqlexpress',
      database: 'northwind_test',
      options: {
        trustServerCertificate: true,
        trustedConnection: true,
        enableArithAbort: true,
        connectTimeout: 5000,
        requestTimeout: 10000
      }
    }
  }
];

async function testConnection(name, config) {
  console.log(`\nTesting: ${name}`);
  console.log(`  Server: ${config.server}${config.port ? ':' + config.port : ''}`);
  console.log(`  Database: ${config.database}`);
  console.log(`  User: ${config.user || '(Windows Auth)'}`);
  
  let pool = null;
  try {
    pool = await sql.connect(config);
    const result = await pool.query('SELECT @@VERSION as version');
    console.log(`  ✓ SUCCESS`);
    console.log(`  SQL Server Version: ${result.recordset[0].version.split('\n')[0]}`);
    
    // Check for flyway_schema_history table
    const tableCheck = await pool.query(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'flyway_schema_history'
    `);
    
    if (tableCheck.recordset[0].count > 0) {
      console.log(`  ✓ flyway_schema_history table found`);
      const historyCount = await pool.query('SELECT COUNT(*) as count FROM flyway_schema_history');
      console.log(`  Migrations: ${historyCount.recordset[0].count}`);
    } else {
      console.log(`  ⚠ flyway_schema_history table NOT found`);
    }
    
    return true;
  } catch (e) {
    console.log(`  ✗ FAILED: ${e.message}`);
    return false;
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

async function checkSqlServerServices() {
  console.log('Checking SQL Server services...\n');
  const { exec } = require('child_process');
  
  return new Promise((resolve) => {
    exec('sc query "MSSQL$SQLEXPRESS"', (error, stdout, stderr) => {
      if (error) {
        console.log('SQL Server Express service status: NOT FOUND or NOT INSTALLED');
        console.log('Try checking service with: Get-Service -Name "*SQL*" | Select Name, Status\n');
      } else {
        const running = stdout.includes('RUNNING');
        if (running) {
          console.log('✓ SQL Server Express (MSSQL$SQLEXPRESS) is RUNNING\n');
        } else {
          console.log('✗ SQL Server Express (MSSQL$SQLEXPRESS) is NOT RUNNING');
          console.log('Start it with: net start "MSSQL$SQLEXPRESS"\n');
        }
      }
      resolve();
    });
  });
}

async function main() {
  console.log('='.repeat(60));
  console.log('SQL Server Connection Test');
  console.log('='.repeat(60));
  
  await checkSqlServerServices();
  
  let successCount = 0;
  for (const { name, config } of configurations) {
    const success = await testConnection(name, config);
    if (success) successCount++;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`Results: ${successCount}/${configurations.length} configurations successful`);
  console.log('='.repeat(60));
  
  if (successCount === 0) {
    console.log('\nTroubleshooting steps:');
    console.log('1. Verify SQL Server Express is installed');
    console.log('2. Check if the service is running:');
    console.log('   Get-Service -Name "*SQL*" | Select Name, Status');
    console.log('3. Start the service:');
    console.log('   net start "MSSQL$SQLEXPRESS"');
    console.log('4. Enable TCP/IP in SQL Server Configuration Manager');
    console.log('5. Check firewall settings for port 1433');
    console.log('6. Verify the database exists and credentials are correct');
  }
}

main().catch(console.error);
