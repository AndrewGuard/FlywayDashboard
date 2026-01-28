/**
 * Shared ROI calculation utilities
 * Used across dashboard widgets and ROI calculation page
 */

export interface UserMetricsInput {
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
}

export interface FlywayMetricsInput {
  deploymentsPerQuarter: number;
  leadTimeDays: number;
  scriptFailureRate: number;
}

export interface ROIBreakdown {
  leadTimeReduction: number;
  timeSavingsPerQuarter: number;
  failureRateReduction: number;
  failureSavingsPerQuarter: number;
  deploymentIncrease: number;
  efficiencySavings: number;
  laborSavingsPerQuarter: number;
  totalQuarterlySavings: number;
  annualSavings: number;
  netBenefit: number;
  roiPercentage: number;
  paybackMonths: number;
}

/**
 * Calculate ROI based on baseline (non-Flyway) and current (Flyway) metrics
 * 
 * This calculation uses DORA (DevOps Research and Assessment) metrics and includes:
 * 1. Lead time savings - cost of delay reduction
 * 2. Failure rate savings - reduced incident costs
 * 3. Deployment efficiency - value from increased deployment frequency
 * 4. Labor savings - DBA and developer time savings from automation
 */
export function calculateROI(
  baselineMetrics: UserMetricsInput,
  flywayMetrics: FlywayMetricsInput
): ROIBreakdown {
  // Baseline (non-Flyway) values
  const nonFlywayDep = baselineMetrics.deploymentsPerQuarter;
  const nonFlywayLead = baselineMetrics.leadTimeDays;
  const nonFlywayFail = baselineMetrics.scriptFailureRate;
  const savingsPerDep = baselineMetrics.savingsPerDeployment;
  const implCost = baselineMetrics.implementationCost;
  const costOfDelay = baselineMetrics.costOfDelayPerDay;

  // Current Flyway values
  const flywayDep = flywayMetrics.deploymentsPerQuarter;
  const flywayLead = flywayMetrics.leadTimeDays;
  const flywayFail = flywayMetrics.scriptFailureRate;

  // 1. Lead time savings (DORA-aligned)
  const leadTimeReduction = Math.max(0, nonFlywayLead - flywayLead);
  const leadTimeSavingsPerDeployment = leadTimeReduction * costOfDelay;
  const timeSavingsPerQuarter = leadTimeSavingsPerDeployment * flywayDep;

  // 2. Cost savings from reduced failures
  const failureRateReduction = Math.max(0, nonFlywayFail - flywayFail) / 100;
  const failureSavingsPerQuarter = failureRateReduction * flywayDep * savingsPerDep;

  // 3. Deployment efficiency savings
  const deploymentIncrease = Math.max(0, flywayDep - nonFlywayDep);
  const efficiencySavings = deploymentIncrease * (savingsPerDep * 0.3);

  // 4. DBA and developer time savings (80% time reduction with automation)
  const dbaHourlyRate = baselineMetrics.dbaAnnualSalary / 2080; // 2080 working hours per year
  const devHourlyRate = baselineMetrics.developerAnnualSalary / 2080;
  const dbaTimeSavingsPerDeployment = baselineMetrics.dbaHoursPerDeployment * 0.8 * dbaHourlyRate;
  const devTimeSavingsPerDeployment = baselineMetrics.developerHoursPerDeployment * 0.8 * devHourlyRate;
  const laborSavingsPerQuarter = (dbaTimeSavingsPerDeployment + devTimeSavingsPerDeployment) * flywayDep;

  // Total quarterly savings
  const totalQuarterlySavings = timeSavingsPerQuarter + failureSavingsPerQuarter + efficiencySavings + laborSavingsPerQuarter;

  // Annual ROI
  const annualSavings = totalQuarterlySavings * 4;
  const netBenefit = annualSavings - implCost;
  const roiPercentage = implCost > 0 ? (netBenefit / implCost) * 100 : 0;
  const paybackMonths = annualSavings > 0 ? Math.ceil((implCost / annualSavings) * 12) : 0;

  return {
    leadTimeReduction,
    timeSavingsPerQuarter,
    failureRateReduction: failureRateReduction * 100, // Convert back to percentage
    failureSavingsPerQuarter,
    deploymentIncrease,
    efficiencySavings,
    laborSavingsPerQuarter,
    totalQuarterlySavings,
    annualSavings,
    netBenefit,
    roiPercentage: Math.round(roiPercentage),
    paybackMonths
  };
}
