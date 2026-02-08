/**
 * Chart data processing utilities
 * Shared logic for processing migration data into chart formats
 */

/**
 * Color palettes for consistent chart styling
 */
export const CHART_COLORS = {
  primary: [
    'rgb(75, 192, 192)',
    'rgb(255, 99, 132)',
    'rgb(54, 162, 235)',
    'rgb(255, 206, 86)',
    'rgb(153, 102, 255)',
    'rgb(255, 159, 64)'
  ],
  platforms: {
    'Microsoft SQL Server': 'rgba(0, 120, 215, 0.8)',
    'PostgreSQL': 'rgba(51, 103, 145, 0.8)',
    'Oracle': 'rgba(255, 0, 0, 0.8)',
    'MySQL': 'rgba(0, 117, 143, 0.8)',
    'MongoDB': 'rgba(0, 237, 100, 0.8)',
    'Other': 'rgba(158, 158, 158, 0.8)'
  }
};

/**
 * Group migrations by a key function
 */
export function groupBy<T>(
  items: T[],
  keyFn: (item: T) => string
): Record<string, T[]> {
  return items.reduce((acc, item) => {
    const key = keyFn(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

/**
 * Count migrations by a key function
 */
export function countBy<T>(
  items: T[],
  keyFn: (item: T) => string
): Record<string, number> {
  return items.reduce((acc, item) => {
    const key = keyFn(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

/**
 * Extract database platform from migration record
 */
export function extractPlatform(migration: any): string {
  const dbType = migration.dbType || migration.db_type || '';
  
  if (dbType) {
    const lower = dbType.toLowerCase();
    if (lower.includes('sql server') || lower.includes('sqlserver')) return 'Microsoft SQL Server';
    if (lower.includes('postgres')) return 'PostgreSQL';
    if (lower.includes('oracle')) return 'Oracle';
    if (lower.includes('mysql') || lower.includes('mariadb')) return 'MySQL';
    if (lower.includes('mongodb')) return 'MongoDB';
  }

  // Fallback to description/database/type fields
  const desc = (migration.description || '').toLowerCase();
  const db = (migration.database || '').toLowerCase();
  const type = (migration.type || '').toLowerCase();
  const combined = `${desc} ${db} ${type}`;

  if (combined.includes('sql server') || combined.includes('sqlserver') || combined.includes('mssql')) {
    return 'Microsoft SQL Server';
  }
  if (combined.includes('postgres') || combined.includes('postgresql')) return 'PostgreSQL';
  if (combined.includes('oracle')) return 'Oracle';
  if (combined.includes('mysql') || combined.includes('mariadb')) return 'MySQL';
  if (combined.includes('mongodb') || combined.includes('mongo')) return 'MongoDB';

  return 'Other';
}

/**
 * Process migrations for "Deployments Over Time" chart
 */
export function processDeploymentsOverTime(migrations: any[]) {
  const byDateAndDb = {};
  
  migrations.forEach(m => {
    const dateStr = m.installed_on || m.installedOn;
    if (!dateStr) return;
    
    const date = new Date(dateStr).toISOString().slice(0, 10);
    const db = m.database || m.schema || 'default';
    
    if (!byDateAndDb[date]) byDateAndDb[date] = {};
    if (!byDateAndDb[date][db]) byDateAndDb[date][db] = 0;
    byDateAndDb[date][db]++;
  });

  const dates = Object.keys(byDateAndDb).sort();
  const databases = Array.from(
    new Set(migrations.map(m => m.database || m.schema || 'default'))
  );

  const datasets = databases.map((db, i) => ({
    label: db,
    data: dates.map(d => byDateAndDb[d]?.[db] || 0),
    borderColor: CHART_COLORS.primary[i % CHART_COLORS.primary.length],
    backgroundColor: CHART_COLORS.primary[i % CHART_COLORS.primary.length]
      .replace('rgb', 'rgba')
      .replace(')', ', 0.5)'),
    tension: 0.1
  }));

  return { labels: dates, datasets };
}

/**
 * Process migrations for "Average Deployment Time" chart
 */
export function processAverageDeploymentTime(migrations: any[]) {
  const dbTimes = {};
  
  migrations.forEach(m => {
    const db = m.database || m.schema || 'default';
    const execTime = Number(m.execution_time) || 0;
    
    if (!dbTimes[db]) {
      dbTimes[db] = { total: 0, count: 0 };
    }
    dbTimes[db].total += execTime;
    dbTimes[db].count += 1;
  });

  const labels = Object.keys(dbTimes);
  const avgTimes = labels.map(db =>
    dbTimes[db].count > 0 ? Math.round(dbTimes[db].total / dbTimes[db].count) : 0
  );

  return {
    labels,
    datasets: [{
      label: 'Average Deployment Time (ms)',
      data: avgTimes,
      backgroundColor: 'rgba(54, 162, 235, 0.5)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1
    }]
  };
}

/**
 * Process migrations for "Migrations per Month" chart
 */
export function processMigrationsPerMonth(migrations: any[]) {
  const byMonth = {};
  
  migrations.forEach(m => {
    const dateStr = m.installed_on || m.installedOn;
    if (!dateStr) return;
    
    const month = new Date(dateStr).toISOString().slice(0, 7);
    byMonth[month] = (byMonth[month] || 0) + 1;
  });

  const labels = Object.keys(byMonth).sort();
  const values = labels.map(m => byMonth[m]);

  return {
    labels,
    datasets: [{
      label: 'Migrations per Month',
      data: values,
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
      tension: 0.1
    }]
  };
}

/**
 * Process migrations for pie chart (databases or platforms)
 */
export function processPieChartData(
  migrations: any[],
  keyFn: (m: any) => string,
  colorMap?: Record<string, string>
) {
  const counts = countBy(migrations, keyFn);
  const labels = Object.keys(counts);
  const values = Object.values(counts);

  const defaultColors = [
    'rgba(255, 99, 132, 0.8)',
    'rgba(54, 162, 235, 0.8)',
    'rgba(255, 206, 86, 0.8)',
    'rgba(75, 192, 192, 0.8)',
    'rgba(153, 102, 255, 0.8)'
  ];

  const backgroundColor = colorMap
    ? labels.map(label => colorMap[label] || 'rgba(158, 158, 158, 0.8)')
    : defaultColors.slice(0, labels.length);

  return {
    labels,
    datasets: [{
      data: values,
      backgroundColor,
      borderWidth: 1
    }]
  };
}

/**
 * Filter out UNDO and BASELINE migrations
 */
export function filterProductionMigrations(migrations: any[]): any[] {
  return migrations.filter(m => {
    const type = m.type ?? '';
    return type !== 'UNDO_SQL' && type !== 'BASELINE' && !String(m.script).startsWith('U');
  });
}

/**
 * Parse date safely with fallback
 */
export function parseDate(dateStr: string | undefined | null): Date | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Format date for display
 */
export function formatDate(dateStr: string | undefined | null): string {
  const date = parseDate(dateStr);
  if (!date) return 'N/A';
  
  try {
    return date.toLocaleString();
  } catch {
    return dateStr || 'N/A';
  }
}
