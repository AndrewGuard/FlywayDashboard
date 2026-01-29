/**
 * Shared ROI calculation utilities
 * Used across dashboard widgets and ROI calculation page
 */

export interface ROIParameters {
  laborAutomationPct: number;        // Percentage of labor automated (0-100)
  failureCostMultiplier: number;     // How much failures cost vs successful deployments
  costOfDelayMultiplier: number;     // Multiplier for opportunity costs
  deploymentValueFactor: number;     // Value factor for additional deployments (0-1)
}

export const DEFAULT_ROI_PARAMETERS: ROIParameters = {
  laborAutomationPct: 75,
  failureCostMultiplier: 1.0,
  costOfDelayMultiplier: 1.0,
  deploymentValueFactor: 0.5
};

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
 * Calculate ROI using DORA metrics with adjustable parameters
 * 
 * This calculation uses DORA (DevOps Research and Assessment) metrics:
 * 1. Lead time savings - cost of delay reduction (adjustable via costOfDelayMultiplier)
 * 2. Failure rate savings - reduced incident costs (adjustable via failureCostMultiplier)
 * 3. Deployment efficiency - value from increased deployment frequency (adjustable via deploymentValueFactor)
 * 4. Labor savings - DBA and developer time savings (adjustable via laborAutomationPct)
 */
export function calculateROI(
  baselineMetrics: UserMetricsInput,
  flywayMetrics: FlywayMetricsInput,
  parameters: ROIParameters = DEFAULT_ROI_PARAMETERS
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

  // 1. Lead time savings (DORA-aligned) with adjustable cost of delay multiplier
  const leadTimeReduction = Math.max(0, nonFlywayLead - flywayLead);
  const adjustedCostOfDelay = costOfDelay * parameters.costOfDelayMultiplier;
  const leadTimeSavingsPerDeployment = leadTimeReduction * adjustedCostOfDelay;
  const timeSavingsPerQuarter = leadTimeSavingsPerDeployment * flywayDep;

  // 2. Cost savings from reduced failures with adjustable multiplier
  const failureRateReduction = Math.max(0, nonFlywayFail - flywayFail) / 100;
  const adjustedFailureCost = savingsPerDep * parameters.failureCostMultiplier;
  const failureSavingsPerQuarter = failureRateReduction * flywayDep * adjustedFailureCost;

  // 3. Deployment efficiency savings with adjustable value factor
  const deploymentIncrease = Math.max(0, flywayDep - nonFlywayDep);
  const efficiencySavings = deploymentIncrease * (savingsPerDep * parameters.deploymentValueFactor);

  // 4. DBA and developer time savings with adjustable automation percentage
  const dbaHourlyRate = baselineMetrics.dbaAnnualSalary / 2080; // 2080 working hours per year
  const devHourlyRate = baselineMetrics.developerAnnualSalary / 2080;
  const automationFactor = parameters.laborAutomationPct / 100; // Convert percentage to decimal
  const dbaTimeSavingsPerDeployment = baselineMetrics.dbaHoursPerDeployment * automationFactor * dbaHourlyRate;
  const devTimeSavingsPerDeployment = baselineMetrics.developerHoursPerDeployment * automationFactor * devHourlyRate;
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

/**
 * ROI Parameter Presets for different calculation approaches
 */
export const ROI_PRESETS: Record<string, { name: string; description: string; parameters: ROIParameters }> = {
  conservative: {
    name: 'Conservative',
    description: 'Lower estimates for cautious ROI projections',
    parameters: {
      laborAutomationPct: 50,           // 50% labor automation
      failureCostMultiplier: 0.75,      // Failures cost 75% of successful deployments
      costOfDelayMultiplier: 0.8,       // 80% of base opportunity cost
      deploymentValueFactor: 0.3        // 30% value from additional deployments
    }
  },
  balanced: {
    name: 'Balanced',
    description: 'Standard DORA-aligned estimates (recommended)',
    parameters: {
      laborAutomationPct: 75,           // 75% labor automation (DORA standard)
      failureCostMultiplier: 1.0,       // Failures cost same as deployments
      costOfDelayMultiplier: 1.0,       // Base opportunity cost
      deploymentValueFactor: 0.5        // 50% value from additional deployments
    }
  },
  aggressive: {
    name: 'Aggressive',
    description: 'Higher estimates including indirect costs and full automation potential',
    parameters: {
      laborAutomationPct: 90,           // 90% labor automation with full commitment
      failureCostMultiplier: 2.0,       // Failures cost 2x successful deployments
      costOfDelayMultiplier: 1.5,       // 150% opportunity cost (includes indirect impact)
      deploymentValueFactor: 0.7        // 70% value from additional deployments
    }
  }
};
