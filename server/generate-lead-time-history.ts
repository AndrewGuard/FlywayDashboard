import { dbHelpers, db } from './db/database';
import { LeadTimeHistoryPoint } from './types';

// Generate historical lead time data points for the chart
function generateHistoricalLeadTimeData(): void {
  console.log('Generating historical lead time data for chart visualization...\n');

  // Get current user-defined non-Flyway lead time
  const userData = dbHelpers.getUserMetrics();
  const nonFlywayLeadTime = Number(userData?.leadTimeDays) || 20;

  // Create data points for the last 90 days
  const dataPoints: LeadTimeHistoryPoint[] = [];
  const today = new Date();
  
  // Simulate a gradual improvement in Flyway lead times over 90 days
  // Starting from roughly the same as non-Flyway, improving to current average
  const daysToGenerate = 90;
  const startingLeadTime = nonFlywayLeadTime; // Start at same level as non-Flyway
  const currentLeadTime = 1.7; // Current average from our data
  
  for (let i = daysToGenerate; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().slice(0, 10);
    
    // Calculate progressive improvement
    const progress = 1 - (i / daysToGenerate); // 0 at start, 1 at end
    
    // Use exponential decay for more realistic improvement curve
    // Early adoption shows rapid improvement, then plateaus
    const improvementFactor = 1 - Math.pow(1 - progress, 2);
    const flywayLeadTime = startingLeadTime - (startingLeadTime - currentLeadTime) * improvementFactor;
    
    // Add some realistic variation (+/- 10%) to Flyway lead times only
    const variation = (Math.random() - 0.5) * 0.2;
    const variedFlywayLeadTime = flywayLeadTime * (1 + variation);
    
    // Non-Flyway baseline stays constant (flat line) reflecting user-defined input
    
    dataPoints.push({
      date: dateStr,
      flywayLeadTime: Math.max(0, Math.round(variedFlywayLeadTime * 10) / 10),
      nonFlywayLeadTime: nonFlywayLeadTime, // Flat line - no variation
      timestamp: new Date().toISOString()
    });
  }

  console.log(`Generated ${dataPoints.length} data points from ${dataPoints[0].date} to ${dataPoints[dataPoints.length - 1].date}`);
  console.log(`\nStarting Flyway lead time: ${dataPoints[0].flywayLeadTime} days`);
  console.log(`Current Flyway lead time: ${dataPoints[dataPoints.length - 1].flywayLeadTime} days`);
  console.log(`Non-Flyway baseline (flat line): ${nonFlywayLeadTime} days`);
  console.log(`Improvement: ${((dataPoints[0].flywayLeadTime - dataPoints[dataPoints.length - 1].flywayLeadTime) / dataPoints[0].flywayLeadTime * 100).toFixed(1)}%\n`);

  // Clear existing data and insert new historical data
  db.prepare('DELETE FROM lead_time_history').run();
  
  const stmt = db.prepare(`
    INSERT INTO lead_time_history (date, flyway_lead_time, non_flyway_lead_time, timestamp)
    VALUES (?, ?, ?, ?)
  `);
  
  const insertMany = db.transaction((points: LeadTimeHistoryPoint[]) => {
    for (const point of points) {
      stmt.run(point.date, point.flywayLeadTime, point.nonFlywayLeadTime, point.timestamp);
    }
  });
  
  insertMany(dataPoints);
  
  console.log(`✓ Inserted ${dataPoints.length} historical data points`);
  console.log('\nThe Lead Time Over Time chart should now display a trend showing:');
  console.log('  - Flyway lead times improving from ~20 days to ~1.7 days');
  console.log(`  - Non-Flyway baseline as a flat line at ${nonFlywayLeadTime} days (user-defined)`);
  console.log('\nRefresh your UI to see the updated chart.');
}

// Run the script
try {
  generateHistoricalLeadTimeData();
  process.exit(0);
} catch (e) {
  const err = e as Error;
  console.error('Error generating historical data:', err);
  process.exit(1);
}
