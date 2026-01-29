import { Router, Request, Response } from 'express';
import { dbHelpers } from '../db/database';
import * as flywayHistory from '../flywayHistory';

// Helper to parse script datetime from script name
// Expects format like V012_20250929152836__bar.sql (YYYYMMDDHHMMSS)
// The timestamp represents UTC time (matching the database installed_on field)
function parseScriptDateTime(scriptName: string): Date | null {
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
    
    // Use Date.UTC to create a date in UTC, matching the database timezone
    const date = new Date(Date.UTC(year, month, day, hour, minute, second));
    
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  return null;
}

const router = Router();

// GET lead times
router.get('/api/metrics/lead-times', (_req: Request, res: Response) => {
  try {
    const data = dbHelpers.getLeadTimes();
    res.json(data);
  } catch (e) {
    const err = e as Error;
    console.error('Get lead times error:', err);
    res.status(500).json({ message: 'Failed to get lead times' });
  }
});

// Refresh lead times from flyway history
router.get('/api/metrics/lead-times/refresh', async (_req: Request, res: Response) => {
  try {
    let prodHistory: any[] = [];

    // Get PRODUCTION flyway history only
    try {
      if (flywayHistory?.getFlywayHistoryProd) {
        prodHistory = await flywayHistory.getFlywayHistoryProd() ?? [];
      }
    } catch (e) {
      const err = e as Error;
      console.warn('Failed to get flyway history:', err);
    }

    const leadTimes: any[] = [];
    const msPerDay = 24 * 60 * 60 * 1000;

    prodHistory.forEach(m => {
      const script = m.script ?? '';
      const type = m.type ?? '';
      const version = m.version ?? m.version_number ?? '';
      
      // Skip UNDO migrations, baselines, and empty scripts
      if (type === 'UNDO_SQL' || type === 'BASELINE' || String(script).startsWith('U')) return;
      if (!script) return;

      // Parse the datetime stamp from the script name (e.g., V012_20250929152836__bar.sql)
      const scriptDateTime = parseScriptDateTime(script);
      if (!scriptDateTime) {
        console.warn(`Could not parse script datetime from: ${script}`);
        return;
      }

      // Get the deployment date from installed_on
      const deployDate = new Date(m.installed_on || m.installedOn || m.installed || m.installedOnUtc);
      if (isNaN(deployDate.getTime())) {
        console.warn(`Invalid deploy date for script: ${script}`);
        return;
      }

      // Calculate lead time as the delta between script creation and deployment
      const rawLeadTime = (deployDate.getTime() - scriptDateTime.getTime()) / msPerDay;
      
      // If script was created AFTER deployment (negative), set to 0
      const leadTimeDays = Math.max(0, rawLeadTime);

      leadTimes.push({
        script: script,
        version: version,
        scriptDate: scriptDateTime.toISOString(),
        deployDate: deployDate.toISOString(),
        leadTimeDays: parseFloat(leadTimeDays.toFixed(2)),
        originalLeadTime: parseFloat(rawLeadTime.toFixed(2)),
        database: m.database,
        environment: m.environment
      });
    });

    console.log(`Calculated lead times for ${leadTimes.length} production migrations`);
    
    // Clear existing data and insert fresh calculations
    const data = dbHelpers.clearAndInsertLeadTimes(leadTimes);
    res.json(data);
  } catch (e) {
    const err = e as Error;
    console.error('Refresh lead times error:', err);
    res.status(500).json({ message: 'Failed to refresh lead times' });
  }
});

export default router;
