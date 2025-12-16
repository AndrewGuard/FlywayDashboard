const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'flyway-dashboard.db');
const db = new Database(DB_PATH);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  -- User-defined metrics
  CREATE TABLE IF NOT EXISTS user_defined_metrics (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    deployments_per_quarter REAL DEFAULT 10,
    lead_time_days REAL DEFAULT 20,
    script_failure_rate REAL DEFAULT 5,
    savings_per_deployment REAL DEFAULT 1000,
    implementation_cost REAL DEFAULT 9751,
    dba_count INTEGER DEFAULT 0,
    dba_time_saved REAL DEFAULT 0,
    dba_salary REAL DEFAULT 0,
    developer_count INTEGER DEFAULT 0,
    developer_time_saved REAL DEFAULT 0,
    developer_salary REAL DEFAULT 0,
    flyway_licensing_cost REAL DEFAULT 0,
    flyway_implementation_time REAL DEFAULT 0,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Lead time history
  CREATE TABLE IF NOT EXISTS lead_time_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT UNIQUE NOT NULL,
    flyway_lead_time REAL DEFAULT 0,
    non_flyway_lead_time REAL DEFAULT 0,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Deployments over time
  CREATE TABLE IF NOT EXISTS deployments_over_time (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT UNIQUE NOT NULL,
    flyway_deployments INTEGER DEFAULT 0,
    non_flyway_deployments INTEGER DEFAULT 0,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Lead times (calculated from migrations)
  CREATE TABLE IF NOT EXISTS lead_times (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    script TEXT NOT NULL,
    version TEXT NOT NULL,
    script_date TEXT,
    deploy_date TEXT,
    lead_time_days REAL DEFAULT 0,
    original_lead_time REAL DEFAULT 0,
    database TEXT,
    environment TEXT,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Migration lead times cache
  CREATE TABLE IF NOT EXISTS migration_lead_times (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    script TEXT NOT NULL,
    version TEXT,
    script_date TEXT,
    deploy_date TEXT,
    lead_time_days REAL DEFAULT 0,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Insert default user metrics if not exists
  INSERT OR IGNORE INTO user_defined_metrics (id) VALUES (1);
`);

// Helper functions
const dbHelpers = {
  // User-defined metrics
  getUserMetrics() {
    const row = db.prepare('SELECT * FROM user_defined_metrics WHERE id = 1').get();
    if (!row) return null;
    return {
      deploymentsPerQuarter: row.deployments_per_quarter,
      leadTimeDays: row.lead_time_days,
      scriptFailureRate: row.script_failure_rate,
      savingsPerDeployment: row.savings_per_deployment,
      implementationCost: row.implementation_cost,
      dbaCount: row.dba_count,
      dbaTimeSaved: row.dba_time_saved,
      dbaSalary: row.dba_salary,
      developerCount: row.developer_count,
      developerTimeSaved: row.developer_time_saved,
      developerSalary: row.developer_salary,
      flywayLicensingCost: row.flyway_licensing_cost,
      flywayImplementationTime: row.flyway_implementation_time,
      updatedAt: row.updated_at
    };
  },

  updateUserMetrics(metrics) {
    const stmt = db.prepare(`
      UPDATE user_defined_metrics SET
        deployments_per_quarter = ?,
        lead_time_days = ?,
        script_failure_rate = ?,
        savings_per_deployment = ?,
        implementation_cost = ?,
        dba_count = ?,
        dba_time_saved = ?,
        dba_salary = ?,
        developer_count = ?,
        developer_time_saved = ?,
        developer_salary = ?,
        flyway_licensing_cost = ?,
        flyway_implementation_time = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `);
    stmt.run(
      metrics.deploymentsPerQuarter ?? 10,
      metrics.leadTimeDays ?? 20,
      metrics.scriptFailureRate ?? 5,
      metrics.savingsPerDeployment ?? 1000,
      metrics.implementationCost ?? 9751,
      metrics.dbaCount ?? 0,
      metrics.dbaTimeSaved ?? 0,
      metrics.dbaSalary ?? 0,
      metrics.developerCount ?? 0,
      metrics.developerTimeSaved ?? 0,
      metrics.developerSalary ?? 0,
      metrics.flywayLicensingCost ?? 0,
      metrics.flywayImplementationTime ?? 0
    );
    return this.getUserMetrics();
  },

  // Lead time history
  getLeadTimeHistory() {
    const rows = db.prepare('SELECT * FROM lead_time_history ORDER BY date ASC').all();
    return {
      dataPoints: rows.map(r => ({
        date: r.date,
        flywayLeadTime: r.flyway_lead_time,
        nonFlywayLeadTime: r.non_flyway_lead_time,
        timestamp: r.timestamp
      }))
    };
  },

  upsertLeadTimeHistory(point) {
    const stmt = db.prepare(`
      INSERT INTO lead_time_history (date, flyway_lead_time, non_flyway_lead_time, timestamp)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        flyway_lead_time = excluded.flyway_lead_time,
        non_flyway_lead_time = excluded.non_flyway_lead_time,
        timestamp = excluded.timestamp
    `);
    stmt.run(
      point.date,
      point.flywayLeadTime ?? 0,
      point.nonFlywayLeadTime ?? 0,
      point.timestamp ?? new Date().toISOString()
    );
    return this.getLeadTimeHistory();
  },

  // Deployments over time
  getDeploymentsOverTime() {
    const rows = db.prepare('SELECT * FROM deployments_over_time ORDER BY date ASC').all();
    return {
      dataPoints: rows.map(r => ({
        date: r.date,
        flywayDeployments: r.flyway_deployments,
        nonFlywayDeployments: r.non_flyway_deployments,
        timestamp: r.timestamp
      }))
    };
  },

  upsertDeploymentsOverTime(point) {
    const stmt = db.prepare(`
      INSERT INTO deployments_over_time (date, flyway_deployments, non_flyway_deployments, timestamp)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        flyway_deployments = excluded.flyway_deployments,
        non_flyway_deployments = excluded.non_flyway_deployments,
        timestamp = excluded.timestamp
    `);
    stmt.run(
      point.date,
      point.flywayDeployments ?? 0,
      point.nonFlywayDeployments ?? 0,
      point.timestamp ?? new Date().toISOString()
    );
    return this.getDeploymentsOverTime();
  },

  // Lead times (migration calculations)
  getLeadTimes() {
    const rows = db.prepare('SELECT * FROM lead_times ORDER BY deploy_date DESC').all();
    return {
      leadTimes: rows.map(r => ({
        script: r.script,
        version: r.version,
        scriptDate: r.script_date,
        deployDate: r.deploy_date,
        leadTimeDays: r.lead_time_days,
        originalLeadTime: r.original_lead_time,
        database: r.database,
        environment: r.environment
      }))
    };
  },

  clearAndInsertLeadTimes(leadTimes) {
    db.prepare('DELETE FROM lead_times').run();
    const stmt = db.prepare(`
      INSERT INTO lead_times (script, version, script_date, deploy_date, lead_time_days, original_lead_time, database, environment, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertMany = db.transaction((items) => {
      for (const lt of items) {
        stmt.run(
          lt.script,
          lt.version,
          lt.scriptDate,
          lt.deployDate,
          lt.leadTimeDays ?? 0,
          lt.originalLeadTime ?? 0,
          lt.database ?? null,
          lt.environment ?? null,
          new Date().toISOString()
        );
      }
    });
    insertMany(leadTimes);
    return this.getLeadTimes();
  },

  // Migration lead times cache
  getMigrationLeadTimes() {
    const rows = db.prepare('SELECT * FROM migration_lead_times ORDER BY deploy_date DESC').all();
    return rows.map(r => ({
      script: r.script,
      version: r.version,
      scriptDate: r.script_date,
      deployDate: r.deploy_date,
      leadTimeDays: r.lead_time_days
    }));
  },

  clearAndInsertMigrationLeadTimes(leadTimes) {
    db.prepare('DELETE FROM migration_lead_times').run();
    const stmt = db.prepare(`
      INSERT INTO migration_lead_times (script, version, script_date, deploy_date, lead_time_days, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const insertMany = db.transaction((items) => {
      for (const lt of items) {
        stmt.run(
          lt.script,
          lt.version,
          lt.scriptDate,
          lt.deployDate,
          lt.leadTimeDays ?? 0,
          new Date().toISOString()
        );
      }
    });
    insertMany(leadTimes);
    return this.getMigrationLeadTimes();
  }
};

module.exports = { db, dbHelpers };