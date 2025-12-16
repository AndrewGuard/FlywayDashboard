const { dbHelpers } = require('./db/database');

// Generate historical lead time data points for the chart
function generateHistoricalLeadTimeData() {
  console.log('Generating historical lead time data for chart visualization...\n');

  // Get current user-defined non-Flyway lead time
  const userData = dbHelpers.getUserMetrics();
  const nonFlywayLeadTime = Number(userData?.leadTimeDays) || 20;

  // Create data points for the last 90 days
  const dataPoints = [];
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
    
    // Add some realistic variation (+/- 10%)
    const variation = (Math.random() - 0.5) * 0.2;
    const variedFlywayLeadTime = flywayLeadTime * (1 + variation);
    
    // Non-Flyway stays relatively constant with minor variation
    const variedNonFlywayLeadTime = nonFlywayLeadTime * (1 + (Math.random() - 0.5) * 0.1);
    
    dataPoints.push({
      date: dateStr,
      flywayLeadTime: Math.max(0, Math.round(variedFlywayLeadTime * 10) / 10),
      nonFlywayLeadTime: Math.max(0, Math.round(variedNonFlywayLeadTime * 10) / 10),
      timestamp: new Date().toISOString()
    });
  }

  console.log(`Generated ${dataPoints.length} data points from ${dataPoints[0].date} to ${dataPoints[dataPoints.length - 1].date}`);
  console.log(`\nStarting Flyway lead time: ${dataPoints[0].flywayLeadTime} days`);
  console.log(`Current Flyway lead time: ${dataPoints[dataPoints.length - 1].flywayLeadTime} days`);
  console.log(`Non-Flyway lead time (avg): ${nonFlywayLeadTime} days`);
  console.log(`Improvement: ${((dataPoints[0].flywayLeadTime - dataPoints[dataPoints.length - 1].flywayLeadTime) / dataPoints[0].flywayLeadTime * 100).toFixed(1)}%\n`);

  // Clear existing data and insert new historical data
  const db = require('./db/database').db;
  db.prepare('DELETE FROM lead_time_history').run();
  
  const stmt = db.prepare(`
    INSERT INTO lead_time_history (date, flyway_lead_time, non_flyway_lead_time, timestamp)
    VALUES (?, ?, ?, ?)
  `);
  
  const insertMany = db.transaction((points) => {
    for (const point of points) {
      stmt.run(point.date, point.flywayLeadTime, point.nonFlywayLeadTime, point.timestamp);
    }
  });
  
  insertMany(dataPoints);
  
  console.log(`✓ Inserted ${dataPoints.length} historical data points`);
  console.log('\nThe Lead Time Over Time chart should now display a trend showing:');
  console.log('  - Flyway lead times improving from ~20 days to ~1.7 days');
  console.log('  - Non-Flyway lead times staying relatively constant at ~20 days');
  console.log('\nRefresh your UI to see the updated chart.');
}

// Run the script
try {
  generateHistoricalLeadTimeData();
  process.exit(0);
} catch (e) {
  console.error('Error generating historical data:', e);
  process.exit(1);
}
