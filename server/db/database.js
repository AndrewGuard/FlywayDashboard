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
    business_size TEXT DEFAULT 'medium',
    deployments_per_quarter REAL DEFAULT 12,
    lead_time_days REAL DEFAULT 30,
    script_failure_rate REAL DEFAULT 15,
    savings_per_deployment REAL DEFAULT 5000,
    implementation_cost REAL DEFAULT 50000,
    cost_of_delay_per_day REAL DEFAULT 350,
    dba_hours_per_deployment REAL DEFAULT 8,
    developer_hours_per_deployment REAL DEFAULT 4,
    dba_annual_salary REAL DEFAULT 175000,
    developer_annual_salary REAL DEFAULT 155000,
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
    db_type TEXT,
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
      businessSize: row.business_size,
      deploymentsPerQuarter: row.deployments_per_quarter,
      leadTimeDays: row.lead_time_days,
      scriptFailureRate: row.script_failure_rate,
      savingsPerDeployment: row.savings_per_deployment,
      implementationCost: row.implementation_cost,
      costOfDelayPerDay: row.cost_of_delay_per_day,
      dbaHoursPerDeployment: row.dba_hours_per_deployment,
      developerHoursPerDeployment: row.developer_hours_per_deployment,
      dbaAnnualSalary: row.dba_annual_salary,
      developerAnnualSalary: row.developer_annual_salary,
      updatedAt: row.updated_at
    };
  },

  updateUserMetrics(metrics) {
    const stmt = db.prepare(`
      UPDATE user_defined_metrics SET
        business_size = ?,
        deployments_per_quarter = ?,
        lead_time_days = ?,
        script_failure_rate = ?,
        savings_per_deployment = ?,
        implementation_cost = ?,
        cost_of_delay_per_day = ?,
        dba_hours_per_deployment = ?,
        developer_hours_per_deployment = ?,
        dba_annual_salary = ?,
        developer_annual_salary = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `);
    stmt.run(
      metrics.businessSize ?? 'medium',
      metrics.deploymentsPerQuarter ?? 12,
      metrics.leadTimeDays ?? 30,
      metrics.scriptFailureRate ?? 15,
      metrics.savingsPerDeployment ?? 5000,
      metrics.implementationCost ?? 50000,
      metrics.costOfDelayPerDay ?? 350,
      metrics.dbaHoursPerDeployment ?? 8,
      metrics.developerHoursPerDeployment ?? 4,
      metrics.dbaAnnualSalary ?? 175000,
      metrics.developerAnnualSalary ?? 155000
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
        environment: r.environment,
        dbType: r.db_type
      }))
    };
  },

  clearAndInsertLeadTimes(leadTimes) {
    db.prepare('DELETE FROM lead_times').run();
    const stmt = db.prepare(`
      INSERT INTO lead_times (script, version, script_date, deploy_date, lead_time_days, original_lead_time, database, environment, db_type, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          lt.dbType ?? null,
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