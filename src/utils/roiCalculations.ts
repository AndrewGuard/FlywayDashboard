/**
 * Shared ROI calculation utilities
 * Used across dashboard widgets and ROI calculation page
 */

export interface ROIParameters {
  laborAutomationPct: number;        // Percentage of labor automated (0-100)
  failureCostMultiplier: number;     // How much failures cost vs successful deployments
  costOfDelayMultiplier: number;     // Multiplier for opportunity costs
  deploymentValueFactor: number;     // Value factor for additional deployments (0-1)
  rampUpFactor: number;              // First-year adoption ramp-up (0.5 = 50% of benefits in year 1)
}

export const DEFAULT_ROI_PARAMETERS: ROIParameters = {
  laborAutomationPct: 35,    // Realistic first-year adoption
  failureCostMultiplier: 0.8,
  costOfDelayMultiplier: 0.6, // Teams rarely capture full theoretical value
  deploymentValueFactor: 0.3,
  rampUpFactor: 0.5          // 50% of benefits achieved in first year
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
  developerCount?: number;
  dbaCount?: number;
  flywayLicenseCost?: number;
  dbaTrainingHours?: number;
  developerTrainingHours?: number;
  roiAlgorithm?: string;
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
  // Cost breakdown
  oneTimeTrainingCost: number;
  recurringLicenseCost: number;
  totalImplementationCost: number;
  // Improvement percentages
  leadTimeImprovementPct: number;
  capped: boolean;  // True if lead time was capped at 60%
  // 3-year projection
  threeYearSavings: number;
  threeYearNetBenefit: number;
  threeYearROI: number;
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
  const licenseCost = baselineMetrics.flywayLicenseCost || 0;

  // Current Flyway values
  const flywayDep = flywayMetrics.deploymentsPerQuarter;
  const flywayLead = flywayMetrics.leadTimeDays;
  const flywayFail = flywayMetrics.scriptFailureRate;

  // 1. Lead time savings (DORA-aligned) with 60% cap and adjustable cost of delay multiplier
  let leadTimeReduction = Math.max(0, nonFlywayLead - flywayLead);
  const leadTimeImprovementPct = nonFlywayLead > 0 ? (leadTimeReduction / nonFlywayLead) * 100 : 0;
  let capped = false;
  
  // Cap lead time improvement at 60% (realistic for most teams)
  if (leadTimeImprovementPct > 60 && nonFlywayLead > 0) {
    leadTimeReduction = nonFlywayLead * 0.6; // Cap at 60% improvement
    capped = true;
  }
  
  const adjustedCostOfDelay = costOfDelay * parameters.costOfDelayMultiplier;
  const leadTimeSavingsPerDeployment = leadTimeReduction * adjustedCostOfDelay;
  const timeSavingsPerQuarter = leadTimeSavingsPerDeployment * flywayDep * parameters.rampUpFactor;

  // 2. Cost savings from reduced failures with adjustable multiplier and ramp-up
  const failureRateReduction = Math.max(0, nonFlywayFail - flywayFail) / 100;
  const adjustedFailureCost = savingsPerDep * parameters.failureCostMultiplier;
  const failureSavingsPerQuarter = failureRateReduction * flywayDep * adjustedFailureCost * parameters.rampUpFactor;

  // 3. Deployment efficiency savings with adjustable value factor and ramp-up
  const deploymentIncrease = Math.max(0, flywayDep - nonFlywayDep);
  const efficiencySavings = deploymentIncrease * (savingsPerDep * parameters.deploymentValueFactor) * parameters.rampUpFactor;

  // 4. DBA and developer time savings with adjustable automation percentage and ramp-up
  const dbaHourlyRate = baselineMetrics.dbaAnnualSalary / 2080; // 2080 working hours per year
  const devHourlyRate = baselineMetrics.developerAnnualSalary / 2080;
  const automationFactor = parameters.laborAutomationPct / 100; // Convert percentage to decimal
  const dbaTimeSavingsPerDeployment = baselineMetrics.dbaHoursPerDeployment * automationFactor * dbaHourlyRate;
  const devTimeSavingsPerDeployment = baselineMetrics.developerHoursPerDeployment * automationFactor * devHourlyRate;
  const laborSavingsPerQuarter = (dbaTimeSavingsPerDeployment + devTimeSavingsPerDeployment) * flywayDep * parameters.rampUpFactor;

  // Total quarterly savings
  const totalQuarterlySavings = timeSavingsPerQuarter + failureSavingsPerQuarter + efficiencySavings + laborSavingsPerQuarter;

  // Annual ROI (subtract annual license cost from savings)
  const annualSavings = totalQuarterlySavings * 4;
  const annualSavingsAfterLicense = annualSavings - licenseCost;
  const netBenefit = annualSavingsAfterLicense - implCost;
  const roiPercentage = implCost > 0 ? (netBenefit / implCost) * 100 : 0;
  const paybackMonths = annualSavingsAfterLicense > 0 ? Math.ceil((implCost / annualSavingsAfterLicense) * 12) : 0;

  // Calculate cost breakdown
  const oneTimeTrainingCost = implCost - licenseCost; // Training is one-time
  const recurringLicenseCost = licenseCost; // License is annual recurring
  
  // 3-year projection (Year 1 with ramp-up, Years 2-3 at full capacity)
  const fullAnnualSavings = (timeSavingsPerQuarter / parameters.rampUpFactor) * 4; // Savings without ramp-up factor
  const year1Savings = annualSavingsAfterLicense; // Year 1 with ramp-up applied
  const year2Savings = fullAnnualSavings - licenseCost; // Year 2 at 100%
  const year3Savings = fullAnnualSavings - licenseCost; // Year 3 at 100%
  const threeYearSavings = year1Savings + year2Savings + year3Savings;
  const threeYearCost = implCost + (licenseCost * 2); // Training + 3 years license (already included in impl for year 1)
  const threeYearNetBenefit = threeYearSavings - threeYearCost;
  const threeYearROI = threeYearCost > 0 ? (threeYearNetBenefit / threeYearCost) * 100 : 0;
  
  return {
    leadTimeReduction,
    timeSavingsPerQuarter,
    failureRateReduction: failureRateReduction * 100, // Convert back to percentage
    failureSavingsPerQuarter,
    deploymentIncrease,
    efficiencySavings,
    laborSavingsPerQuarter,
    totalQuarterlySavings,
    annualSavings: annualSavingsAfterLicense, // Annual savings after license cost
    netBenefit,
    roiPercentage: Math.round(roiPercentage),
    paybackMonths,
    oneTimeTrainingCost,
    recurringLicenseCost,
    totalImplementationCost: implCost,
    leadTimeImprovementPct: Math.round(leadTimeImprovementPct),
    capped,
    threeYearSavings,
    threeYearNetBenefit,
    threeYearROI: Math.round(threeYearROI)
  };
}

/**
 * ROI Parameter Presets for different calculation approaches
 */
export const ROI_PRESETS: Record<string, { name: string; description: string; parameters: ROIParameters }> = {
  realistic: {
    name: 'Realistic',
    description: 'Real-world outcomes with 6-month ramp-up (recommended for most teams)',
    parameters: {
      laborAutomationPct: 35,           // 35% labor automation (realistic first-year adoption)
      failureCostMultiplier: 0.8,       // Failures cost 80% of successful deployments
      costOfDelayMultiplier: 0.6,       // 60% of theoretical value (teams rarely capture full value)
      deploymentValueFactor: 0.3,       // 30% value from additional deployments
      rampUpFactor: 0.5                 // 50% of benefits in first year
    }
  },
  conservative: {
    name: 'Conservative',
    description: 'Lower estimates for cautious ROI projections',
    parameters: {
      laborAutomationPct: 50,           // 50% labor automation
      failureCostMultiplier: 0.75,      // Failures cost 75% of successful deployments
      costOfDelayMultiplier: 0.8,       // 80% of base opportunity cost
      deploymentValueFactor: 0.3,       // 30% value from additional deployments
      rampUpFactor: 0.6                 // 60% of benefits in first year
    }
  },
  balanced: {
    name: 'Balanced',
    description: 'Standard DORA-aligned estimates',
    parameters: {
      laborAutomationPct: 75,           // 75% labor automation (DORA standard)
      failureCostMultiplier: 1.0,       // Failures cost same as deployments
      costOfDelayMultiplier: 1.0,       // Base opportunity cost
      deploymentValueFactor: 0.5,       // 50% value from additional deployments
      rampUpFactor: 0.8                 // 80% of benefits in first year
    }
  },
  aggressive: {
    name: 'Aggressive',
    description: 'Higher estimates including indirect costs and full automation potential',
    parameters: {
      laborAutomationPct: 90,           // 90% labor automation with full commitment
      failureCostMultiplier: 2.0,       // Failures cost 2x successful deployments
      costOfDelayMultiplier: 1.5,       // 150% opportunity cost (includes indirect impact)
      deploymentValueFactor: 0.7,       // 70% value from additional deployments
      rampUpFactor: 1.0                 // 100% of benefits in first year (optimistic)
    }
  }
};
