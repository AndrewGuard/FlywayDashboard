#!/usr/bin/env node

import { execSync } from 'child_process';

console.log('========================================');
console.log('Refreshing All Lead Time Demo Data');
console.log('========================================\n');

try {
  console.log('Step 1: Adding sample lead time data points...');
  execSync('ts-node add-sample-lead-times.ts', { stdio: 'inherit' });
  
  console.log('\n\nStep 2: Generating historical lead time chart data...');
  execSync('ts-node generate-lead-time-history.ts', { stdio: 'inherit' });
  
  console.log('\n========================================');
  console.log('✓ All demo data refreshed successfully!');
  console.log('========================================\n');
  console.log('Summary:');
  console.log('  - Lead time data points: Updated with realistic examples');
  console.log('  - Historical chart data: 90 days of trend data generated');
  console.log('  - Average Flyway lead time: ~1.7 days');
  console.log('  - Non-Flyway baseline: 30 days (flat line from user-defined metrics)');
  console.log('\nRefresh your UI to see the updated metrics and charts.');
  
  process.exit(0);
} catch (e) {
  const err = e as Error;
  console.error('\n✗ Error refreshing demo data:', err.message);
  process.exit(1);
}
