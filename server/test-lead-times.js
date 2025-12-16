const { getFlywayHistoryProd } = require('./flywayHistory');

// Helper to parse script datetime from script name
function parseScriptDateTime(scriptName) {
  if (!scriptName) return null;
  
  // Pattern to match V###_YYYYMMDDHHMMSS__description.sql
  const timestampMatch = scriptName.match(/V\d+_(\d{14})__/);
  if (timestampMatch) {
    const timestamp = timestampMatch[1];
    const year = parseInt(timestamp.substring(0, 4));
    const month = parseInt(timestamp.substring(4, 6)) - 1; // 0-indexed
    const day = parseInt(timestamp.substring(6, 8));
    const hour = parseInt(timestamp.substring(8, 10));
    const minute = parseInt(timestamp.substring(10, 12));
    const second = parseInt(timestamp.substring(12, 14));
    
    const date = new Date(year, month, day, hour, minute, second);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  return null;
}

async function testLeadTimes() {
  try {
    console.log('Fetching production history...\n');
    const prodHistory = await getFlywayHistoryProd();
    
    console.log(`Found ${prodHistory.length} production migrations\n`);
    
    const msPerDay = 24 * 60 * 60 * 1000;
    let successCount = 0;
    let failCount = 0;
    
    prodHistory.forEach((m, idx) => {
      if (idx < 5) { // Show first 5 as examples
        console.log(`\nMigration ${idx + 1}:`);
        console.log(`  Script: ${m.script}`);
        console.log(`  Type: ${m.type}`);
        console.log(`  Database: ${m.database}`);
        console.log(`  Installed: ${m.installed_on}`);
        
        const scriptDateTime = parseScriptDateTime(m.script);
        if (scriptDateTime) {
          console.log(`  Script DateTime: ${scriptDateTime.toISOString()}`);
          const deployDate = new Date(m.installed_on);
          const rawLeadTime = (deployDate - scriptDateTime) / msPerDay;
          const leadTimeDays = Math.max(0, rawLeadTime);
          console.log(`  Lead Time: ${leadTimeDays.toFixed(2)} days (raw: ${rawLeadTime.toFixed(2)})`);
          successCount++;
        } else {
          console.log(`  ⚠ Could not parse datetime from script name`);
          failCount++;
        }
      }
    });
    
    console.log(`\n\nSummary:`);
    console.log(`  Total migrations: ${prodHistory.length}`);
    console.log(`  Successfully parsed: ${successCount}`);
    console.log(`  Failed to parse: ${failCount}`);
    
  } catch (e) {
    console.error('Error testing lead times:', e);
  } finally {
    process.exit(0);
  }
}

testLeadTimes();
