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
  // Spanning Feb 2026 - May 2026 to show recent activity with improving lead times
  const sampleMigrations: LeadTime[] = [
    // --- Recent deployments (last 30 days) - fast lead times ---
    {
      script: 'V120_20260514093000__optimize_order_lookups.sql',
      version: '120.20260514093000',
      scriptDate: new Date('2026-05-14T09:30:00Z').toISOString(),
      deployDate: new Date('2026-05-14T11:00:00Z').toISOString(),
      leadTimeDays: 0.06,
      originalLeadTime: 0.06,
      database: 'northwind_prod',
      environment: 'prod',
      dbType: 'SQL Server'
    },
    {
      script: 'V119_20260512140000__add_shipping_analytics.sql',
      version: '119.20260512140000',
      scriptDate: new Date('2026-05-12T14:00:00Z').toISOString(),
      deployDate: new Date('2026-05-13T09:30:00Z').toISOString(),
      leadTimeDays: 0.81,
      originalLeadTime: 0.81,
      database: 'pagila_prod',
      environment: 'prod',
      dbType: 'PostgreSQL'
    },
    {
      script: 'V118_20260508110000__customer_loyalty_tier.sql',
      version: '118.20260508110000',
      scriptDate: new Date('2026-05-08T11:00:00Z').toISOString(),
      deployDate: new Date('2026-05-09T10:15:00Z').toISOString(),
      leadTimeDays: 0.97,
      originalLeadTime: 0.97,
      database: 'northwind_prod',
      environment: 'prod',
      dbType: 'SQL Server'
    },
    {
      script: 'V117_20260505090000__rental_analytics_view.sql',
      version: '117.20260505090000',
      scriptDate: new Date('2026-05-05T09:00:00Z').toISOString(),
      deployDate: new Date('2026-05-05T14:30:00Z').toISOString(),
      leadTimeDays: 0.23,
      originalLeadTime: 0.23,
      database: 'pagila_prod',
      environment: 'prod',
      dbType: 'PostgreSQL'
    },
    {
      script: 'V116_20260501100000__product_ratings_table.sql',
      version: '116.20260501100000',
      scriptDate: new Date('2026-05-01T10:00:00Z').toISOString(),
      deployDate: new Date('2026-05-02T09:00:00Z').toISOString(),
      leadTimeDays: 0.96,
      originalLeadTime: 0.96,
      database: 'inventory_prod',
      environment: 'prod',
      dbType: 'Oracle'
    },
    // --- 1-2 months ago - moderate lead times ---
    {
      script: 'V115_20260425160000__archive_old_orders.sql',
      version: '115.20260425160000',
      scriptDate: new Date('2026-04-25T16:00:00Z').toISOString(),
      deployDate: new Date('2026-04-27T10:00:00Z').toISOString(),
      leadTimeDays: 1.75,
      originalLeadTime: 1.75,
      database: 'northwind_prod',
      environment: 'prod',
      dbType: 'SQL Server'
    },
    {
      script: 'V114_20260418140000__staff_schedule_table.sql',
      version: '114.20260418140000',
      scriptDate: new Date('2026-04-18T14:00:00Z').toISOString(),
      deployDate: new Date('2026-04-20T11:00:00Z').toISOString(),
      leadTimeDays: 1.88,
      originalLeadTime: 1.88,
      database: 'pagila_prod',
      environment: 'prod',
      dbType: 'PostgreSQL'
    },
    {
      script: 'V113_20260410090000__inventory_alerts_view.sql',
      version: '113.20260410090000',
      scriptDate: new Date('2026-04-10T09:00:00Z').toISOString(),
      deployDate: new Date('2026-04-12T15:00:00Z').toISOString(),
      leadTimeDays: 2.25,
      originalLeadTime: 2.25,
      database: 'inventory_prod',
      environment: 'prod',
      dbType: 'Oracle'
    },
    {
      script: 'V112_20260401110000__payment_method_enum.sql',
      version: '112.20260401110000',
      scriptDate: new Date('2026-04-01T11:00:00Z').toISOString(),
      deployDate: new Date('2026-04-03T09:30:00Z').toISOString(),
      leadTimeDays: 1.94,
      originalLeadTime: 1.94,
      database: 'pagila_prod',
      environment: 'prod',
      dbType: 'PostgreSQL'
    },
    {
      script: 'V111_20260325100000__employee_performance_idx.sql',
      version: '111.20260325100000',
      scriptDate: new Date('2026-03-25T10:00:00Z').toISOString(),
      deployDate: new Date('2026-03-27T14:00:00Z').toISOString(),
      leadTimeDays: 2.17,
      originalLeadTime: 2.17,
      database: 'northwind_prod',
      environment: 'prod',
      dbType: 'SQL Server'
    },
    {
      script: 'V110_20260318140000__discount_codes_table.sql',
      version: '110.20260318140000',
      scriptDate: new Date('2026-03-18T14:00:00Z').toISOString(),
      deployDate: new Date('2026-03-21T10:00:00Z').toISOString(),
      leadTimeDays: 2.83,
      originalLeadTime: 2.83,
      database: 'northwind_prod',
      environment: 'prod',
      dbType: 'SQL Server'
    },
    // --- 2-3 months ago - longer lead times showing improvement over time ---
    {
      script: 'V109_20260310090000__order_tracking_columns.sql',
      version: '109.20260310090000',
      scriptDate: new Date('2026-03-10T09:00:00Z').toISOString(),
      deployDate: new Date('2026-03-14T11:00:00Z').toISOString(),
      leadTimeDays: 4.08,
      originalLeadTime: 4.08,
      database: 'inventory_prod',
      environment: 'prod',
      dbType: 'Oracle'
    },
    {
      script: 'V108_20260301120000__customer_address_audit.sql',
      version: '108.20260301120000',
      scriptDate: new Date('2026-03-01T12:00:00Z').toISOString(),
      deployDate: new Date('2026-03-05T10:00:00Z').toISOString(),
      leadTimeDays: 3.92,
      originalLeadTime: 3.92,
      database: 'northwind_prod',
      environment: 'prod',
      dbType: 'SQL Server'
    },
    {
      script: 'V107_20260220100000__regional_warehouse_schema.sql',
      version: '107.20260220100000',
      scriptDate: new Date('2026-02-20T10:00:00Z').toISOString(),
      deployDate: new Date('2026-02-25T14:00:00Z').toISOString(),
      leadTimeDays: 5.17,
      originalLeadTime: 5.17,
      database: 'pagila_prod',
      environment: 'prod',
      dbType: 'PostgreSQL'
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
