import { dbHelpers } from './db/database';
import { LeadTime } from './types';

// Add sample migrations with realistic lead times for demonstration
function addSampleLeadTimes(): void {
  console.log('Adding sample migrations with longer lead times...\n');

  // Get current lead times
  const currentData = dbHelpers.getLeadTimes();
  const currentLeadTimes = currentData.leadTimes || [];
  
  console.log(`Current migrations: ${currentLeadTimes.length}`);

  // Create sample migrations with various lead times across different platforms
  const sampleMigrations: LeadTime[] = [
    {
      script: 'V100_20251201120000__feature_user_profile.sql',
      version: '100.20251201120000',
      scriptDate: new Date('2025-12-01T12:00:00Z').toISOString(),
      deployDate: new Date('2025-12-15T14:30:00Z').toISOString(),
      leadTimeDays: 14.10,
      originalLeadTime: 14.10,
      database: 'northwind_prod',
      environment: 'prod',
      dbType: 'SQL Server'
    },
    {
      script: 'V101_20251110090000__add_customer_segments.sql',
      version: '101.20251110090000',
      scriptDate: new Date('2025-11-10T09:00:00Z').toISOString(),
      deployDate: new Date('2025-11-17T16:00:00Z').toISOString(),
      leadTimeDays: 7.29,
      originalLeadTime: 7.29,
      database: 'northwind_prod',
      environment: 'prod',
      dbType: 'SQL Server'
    },
    {
      script: 'V102_20251125143000__optimize_queries.sql',
      version: '102.20251125143000',
      scriptDate: new Date('2025-11-25T14:30:00Z').toISOString(),
      deployDate: new Date('2025-11-28T10:00:00Z').toISOString(),
      leadTimeDays: 2.81,
      originalLeadTime: 2.81,
      database: 'northwind_prod',
      environment: 'prod',
      dbType: 'SQL Server'
    },
    {
      script: 'V103_20251205100000__add_indexes.sql',
      version: '103.20251205100000',
      scriptDate: new Date('2025-12-05T10:00:00Z').toISOString(),
      deployDate: new Date('2025-12-10T15:00:00Z').toISOString(),
      leadTimeDays: 5.21,
      originalLeadTime: 5.21,
      database: 'pagila_prod',
      environment: 'prod',
      dbType: 'PostgreSQL'
    },
    {
      script: 'V104_20251210080000__refactor_schema.sql',
      version: '104.20251210080000',
      scriptDate: new Date('2025-12-10T08:00:00Z').toISOString(),
      deployDate: new Date('2025-12-13T11:00:00Z').toISOString(),
      leadTimeDays: 3.13,
      originalLeadTime: 3.13,
      database: 'pagila_prod',
      environment: 'prod',
      dbType: 'PostgreSQL'
    },
    {
      script: 'V105_20251212153000__add_audit_trail.sql',
      version: '105.20251212153000',
      scriptDate: new Date('2025-12-12T15:30:00Z').toISOString(),
      deployDate: new Date('2025-12-14T09:00:00Z').toISOString(),
      leadTimeDays: 1.73,
      originalLeadTime: 1.73,
      database: 'northwind_prod',
      environment: 'prod',
      dbType: 'SQL Server'
    },
    {
      script: 'V106_20251213100000__create_user_table.sql',
      version: '106.20251213100000',
      scriptDate: new Date('2025-12-13T10:00:00Z').toISOString(),
      deployDate: new Date('2025-12-15T14:00:00Z').toISOString(),
      leadTimeDays: 2.17,
      originalLeadTime: 2.17,
      database: 'inventory_prod',
      environment: 'prod',
      dbType: 'Oracle'
    },
    {
      script: 'V107_20251214090000__add_order_history.sql',
      version: '107.20251214090000',
      scriptDate: new Date('2025-12-14T09:00:00Z').toISOString(),
      deployDate: new Date('2025-12-16T11:30:00Z').toISOString(),
      leadTimeDays: 2.10,
      originalLeadTime: 2.10,
      database: 'inventory_prod',
      environment: 'prod',
      dbType: 'Oracle'
    }
  ];

  console.log(`Adding ${sampleMigrations.length} sample migrations...\n`);

  // Clear existing lead times and insert samples
  const result = dbHelpers.clearAndInsertLeadTimes(sampleMigrations);

  console.log(`✓ Successfully added ${result.leadTimes.length} migrations`);
  console.log('\nSample lead time statistics:');
  const times = sampleMigrations.map(m => m.leadTimeDays);
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  console.log(`  Average: ${avg.toFixed(2)} days`);
  console.log(`  Range: ${min.toFixed(2)} - ${max.toFixed(2)} days`);
  console.log('\nDatabases represented:');
  const dbs = [...new Set(sampleMigrations.map(m => `${m.database} (${m.dbType})`))];
  dbs.forEach(db => console.log(`  - ${db}`));
}

// Run the script
try {
  addSampleLeadTimes();
  process.exit(0);
} catch (e) {
  const err = e as Error;
  console.error('Error adding sample lead times:', err);
  process.exit(1);
}
