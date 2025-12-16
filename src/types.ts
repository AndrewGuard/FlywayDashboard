// Shared TypeScript types for the Flyway Dashboard

export interface Migration {
  version?: string;
  description?: string;
  type?: string;
  script?: string;
  checksum?: number;
  installed_by?: string;
  installed_on?: string;
  installedOn?: string;
  completed_on?: string;
  execution_time?: number;
  success?: boolean | number;
  database?: string;
  schema?: string;
}

export interface UserMetrics {
  deploymentsPerQuarter?: number | string;
  leadTimeDays?: number | string;
  scriptFailureRate?: number | string;
  deploymentDurationDays?: number | string;
  peopleInvolved?: number | string;
  averageSalary?: number | string;
  numberOfDevelopers?: number;
  flywayLicensingCost?: number;
  dbaCount?: number;
  dbaTimeSavedPercent?: number;
  dbaSalary?: number;
  developerCount?: number;
  developerTimeSavedPercent?: number;
  developerSalary?: number;
  estimatedImplementationHours?: number;
}

export interface Deployment {
  dbName: string;
  count: number;
  error: string | null;
}

export interface ChartDataPoint {
  name: string;
  migrations: number;
}

export interface PlatformHistory {
  month: string;
  deployments: number;
}

export interface Platform {
  platform: string;
  deployments: number;
  history: PlatformHistory[];
  connStr?: string;
}

export interface LeadTime {
  script: string;
  version: string;
  scriptDate: string;
  deployDate: string;
  leadTimeDays: number;
  database: string;
  environment: string;
}

export interface LineChartDataset {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
  fill?: boolean;
  tension?: number;
}

export interface BarChartDataset {
  label: string;
  data: number[];
  backgroundColor: string | string[];
}

export interface PieChartDataset {
  label: string;
  data: number[];
  backgroundColor: string[];
}

export interface ChartData {
  labels: string[];
  datasets: LineChartDataset[] | BarChartDataset[] | PieChartDataset[];
}
