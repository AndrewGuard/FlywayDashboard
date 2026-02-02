// Database types
export interface UserMetrics {
  businessSize: string;
  deploymentsPerQuarter: number;
  leadTimeDays: number;
  scriptFailureRate: number;
  savingsPerDeployment: number;
  implementationCost: number;
  costOfDelayPerDay: number;
  dbaHoursPerDeployment: number;
  developerHoursPerDeployment: number;
  dbaAnnualSalary: number;
  developerAnnualSalary: number;
  developerCount?: number;
  dbaCount?: number;
  flywayLicenseCost?: number;
  implementationCostPct?: number;
  roiAlgorithm?: string;
  laborAutomationPct?: number;
  failureCostMultiplier?: number;
  costOfDelayMultiplier?: number;
  deploymentValueFactor?: number;
  updatedAt?: string;
}

export interface LeadTimeHistoryPoint {
  date: string;
  flywayLeadTime: number;
  nonFlywayLeadTime: number;
  timestamp?: string;
}

export interface LeadTimeHistory {
  dataPoints: LeadTimeHistoryPoint[];
}

export interface DeploymentPoint {
  date: string;
  flywayDeployments: number;
  nonFlywayDeployments: number;
  timestamp?: string;
}

export interface DeploymentsOverTime {
  dataPoints: DeploymentPoint[];
}

export interface LeadTime {
  script: string;
  version: string;
  scriptDate: string;
  deployDate: string;
  leadTimeDays: number;
  originalLeadTime: number;
  database?: string;
  environment?: string;
  dbType?: string;
}

export interface LeadTimesData {
  leadTimes: LeadTime[];
}

export interface MigrationLeadTime {
  script: string;
  version?: string;
  scriptDate: string;
  deployDate: string;
  leadTimeDays: number;
}

// Flyway history types
export interface FlywayMigration {
  installed_rank: number;
  version: string;
  version_number?: string;
  description: string;
  type: string;
  script: string;
  checksum?: number | null;
  installed_by: string;
  installed_on: string;
  installedOn?: string;
  installed?: string;
  installedOnUtc?: string;
  execution_time: number;
  success: boolean;
  database?: string;
  environment?: string;
  dbType?: string;
  leadTimeDays?: number | null;
  scriptDate?: string | null;
}

// JDBC configuration types
export interface JdbcConnections {
  prod: string[];
  nonProd: string[];
}

export interface PostgresConfig {
  host: string;
  port: number;
  database: string;
  user?: string;
  password?: string;
}

export interface MssqlConfig {
  server: string;
  port: number;
  database?: string;
  user: string;
  password: string;
  options: {
    trustServerCertificate: boolean;
    encrypt: boolean;
    enableArithAbort: boolean;
    connectTimeout: number;
    requestTimeout: number;
  };
  pool?: {
    max: number;
    min: number;
    idleTimeoutMillis: number;
  };
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
}

export interface DeploymentsPerQuarter {
  deploymentsPerQuarter: number;
  extrapolated: boolean;
  availableDays: number;
  totalMigrations: number;
}
