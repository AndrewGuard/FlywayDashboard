/**
 * Shared server utilities for processing migration data
 * Eliminates duplicate logic across server routes
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_IN_QUARTER = 90;

/**
 * Filter valid migrations (SQL type, excluding UNDO and BASELINE)
 */
export function filterValidMigrations(history: any[]): any[] {
  return history.filter(m => {
    const type = m.type ?? '';
    return type === 'SQL' && type !== 'UNDO_SQL' && type !== 'BASELINE';
  });
}

/**
 * Parse deployment date from migration record
 */
export function parseDeploymentDate(migration: any): Date | null {
  const dateStr = migration.installed_on || migration.installedOn || migration.installed || migration.installedOnUtc;
  if (!dateStr) return null;
  
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Add deployment dates to migrations
 */
export function addDeploymentDates(migrations: any[]): any[] {
  return migrations
    .map(m => ({
      ...m,
      deployDate: parseDeploymentDate(m)
    }))
    .filter(m => m.deployDate !== null);
}

/**
 * Calculate deployments per quarter with extrapolation
 */
export function calculateDeploymentsPerQuarter(history: any[]): {
  deploymentsPerQuarter: number;
  extrapolated: boolean;
  availableDays: number;
  totalMigrations: number;
} {
  const validMigrations = addDeploymentDates(filterValidMigrations(history));
  
  const now = new Date();
  const quarterAgo = new Date(now.getTime() - (DAYS_IN_QUARTER * MS_PER_DAY));

  const recentDeployments = validMigrations.filter(m => m.deployDate >= quarterAgo);
  const count = recentDeployments.length;

  const oldestDate = validMigrations.length
    ? validMigrations.reduce((min, m) => m.deployDate < min ? m.deployDate : min, validMigrations[0].deployDate)
    : now;

  const availableDays = Math.min(
    DAYS_IN_QUARTER,
    Math.ceil((now.getTime() - oldestDate.getTime()) / MS_PER_DAY)
  );
  
  const shouldExtrapolate = availableDays < DAYS_IN_QUARTER && availableDays > 0;
  const deploymentsPerQuarter = shouldExtrapolate && availableDays > 0
    ? Math.round((count / availableDays) * DAYS_IN_QUARTER)
    : count;

  return {
    deploymentsPerQuarter,
    extrapolated: shouldExtrapolate,
    availableDays,
    totalMigrations: validMigrations.length
  };
}

/**
 * Parse script datetime from script name
 * Expects format like V012_20250929152836__bar.sql (YYYYMMDDHHMMSS)
 */
export function parseScriptDateTime(scriptName: string): Date | null {
  if (!scriptName) return null;
  
  const timestampMatch = scriptName.match(/V\d+_(\d{14})__/);
  if (!timestampMatch) return null;
  
  const timestamp = timestampMatch[1];
  const year = parseInt(timestamp.substring(0, 4));
  const month = parseInt(timestamp.substring(4, 6)) - 1; // 0-indexed
  const day = parseInt(timestamp.substring(6, 8));
  const hour = parseInt(timestamp.substring(8, 10));
  const minute = parseInt(timestamp.substring(10, 12));
  const second = parseInt(timestamp.substring(12, 14));
  
  const date = new Date(Date.UTC(year, month, day, hour, minute, second));
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Calculate lead times from migration history
 */
export function calculateLeadTimes(prodHistory: any[]): any[] {
  const leadTimes: any[] = [];

  prodHistory.forEach(m => {
    const script = m.script ?? '';
    const type = m.type ?? '';
    const version = m.version ?? m.version_number ?? '';
    
    // Skip UNDO migrations, baselines, and empty scripts
    if (type === 'UNDO_SQL' || type === 'BASELINE' || String(script).startsWith('U')) return;
    if (!script) return;

    const scriptDateTime = parseScriptDateTime(script);
    if (!scriptDateTime) {
      console.warn(`Could not parse script datetime from: ${script}`);
      return;
    }

    const deployDate = parseDeploymentDate(m);
    if (!deployDate) {
      console.warn(`Invalid deploy date for script: ${script}`);
      return;
    }

    // Calculate lead time
    const rawLeadTime = (deployDate.getTime() - scriptDateTime.getTime()) / MS_PER_DAY;
    const leadTimeDays = Math.max(0, rawLeadTime);

    leadTimes.push({
      script,
      version,
      scriptDate: scriptDateTime.toISOString(),
      deployDate: deployDate.toISOString(),
      leadTimeDays: parseFloat(leadTimeDays.toFixed(2)),
      originalLeadTime: parseFloat(rawLeadTime.toFixed(2)),
      database: m.database,
      environment: m.environment
    });
  });

  return leadTimes;
}

/**
 * Safe error response helper
 */
export function sendErrorResponse(res: any, statusCode: number, message: string, error?: Error) {
  if (error) {
    console.error(message, error);
  }
  res.status(statusCode).json({ message, error: error?.message });
}

/**
 * Constants for shared use
 */
export const SERVER_CONSTANTS = {
  MS_PER_DAY,
  DAYS_IN_QUARTER,
  DEFAULT_CACHE_DURATION: 30000 // 30 seconds
};
