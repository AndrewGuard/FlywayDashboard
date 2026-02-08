/**
 * Shared ROI data service
 * Centralizes ROI calculation logic to eliminate duplication between
 * RoiCalculationPage and ChangeInDeploymentMetricsWidget
 */

import { calculateROI, UserMetricsInput, FlywayMetricsInput, ROIParameters, DEFAULT_ROI_PARAMETERS } from './roiCalculations';

/**
 * Calculate implementation cost based on training hours
 */
export function calculateImplementationCost(params: {
  dbaCount: number;
  developerCount: number;
  dbaTrainingHours: number;
  developerTrainingHours: number;
  dbaAnnualSalary: number;
  developerAnnualSalary: number;
  flywayLicenseCost: number;
}): number {
  const dbaHourlyRate = params.dbaAnnualSalary / 2080;
  const devHourlyRate = params.developerAnnualSalary / 2080;
  const dbaTrainingCost = params.dbaCount * params.dbaTrainingHours * dbaHourlyRate;
  const devTrainingCost = params.developerCount * params.developerTrainingHours * devHourlyRate;
  return dbaTrainingCost + devTrainingCost + params.flywayLicenseCost;
}

/**
 * Build baseline metrics from user-defined data
 */
export function buildBaselineMetrics(userData: any): UserMetricsInput {
  return {
    deploymentsPerQuarter: Number(userData.deploymentsPerQuarter) || 10,
    leadTimeDays: Number(userData.leadTimeDays) || 20,
    scriptFailureRate: Number(userData.scriptFailureRate) || 5,
    savingsPerDeployment: Number(userData.savingsPerDeployment) || 1000,
    implementationCost: 0, // Will be calculated separately
    costOfDelayPerDay: Number(userData.costOfDelayPerDay) || 250,
    dbaHoursPerDeployment: Number(userData.dbaHoursPerDeployment) || 8,
    developerHoursPerDeployment: Number(userData.developerHoursPerDeployment) || 4,
    dbaAnnualSalary: Number(userData.dbaAnnualSalary) || 175000,
    developerAnnualSalary: Number(userData.developerAnnualSalary) || 155000,
    developerCount: Number(userData.developerCount) || 5,
    dbaCount: Number(userData.dbaCount) || 2,
    flywayLicenseCost: Number(userData.flywayLicenseCost) || 
      ((Number(userData.developerCount) || 5) + (Number(userData.dbaCount) || 2)) * 3000
  };
}

/**
 * Build ROI parameters from user-defined data or use defaults
 */
export function buildROIParameters(userData: any): ROIParameters {
  return {
    laborAutomationPct: userData.laborAutomationPct ?? DEFAULT_ROI_PARAMETERS.laborAutomationPct,
    failureCostMultiplier: userData.failureCostMultiplier ?? DEFAULT_ROI_PARAMETERS.failureCostMultiplier,
    costOfDelayMultiplier: userData.costOfDelayMultiplier ?? DEFAULT_ROI_PARAMETERS.costOfDelayMultiplier,
    deploymentValueFactor: userData.deploymentValueFactor ?? DEFAULT_ROI_PARAMETERS.deploymentValueFactor,
    rampUpFactor: userData.rampUpFactor ?? DEFAULT_ROI_PARAMETERS.rampUpFactor,
    leadTimeCapPct: userData.leadTimeCapPct ?? DEFAULT_ROI_PARAMETERS.leadTimeCapPct
  };
}

/**
 * Calculate average lead time from lead times array
 */
export function calculateAverageLeadTime(leadTimes: any[]): number {
  if (!Array.isArray(leadTimes) || leadTimes.length === 0) return 0;
  
  const validTimes = leadTimes
    .map(lt => Number(lt.leadTimeDays))
    .filter(n => Number.isFinite(n) && n >= 0);
  
  if (validTimes.length === 0) return 0;
  
  return validTimes.reduce((sum, t) => sum + t, 0) / validTimes.length;
}

/**
 * Calculate failure rate from migration history
 */
export function calculateFailureRate(history: any[]): number {
  if (!Array.isArray(history) || history.length === 0) return 0;
  
  const failed = history.filter(m => m.success === false).length;
  return (failed / history.length) * 100;
}

/**
 * Complete ROI calculation with all dependencies
 * This is the main entry point that should be used by components
 */
export interface ROICalculationInput {
  userData: any;
  flywayDeploymentsPerQuarter: number;
  flywayLeadTime: number;
  flywayFailureRate: number;
}

export function calculateCompleteROI(input: ROICalculationInput) {
  const baselineMetrics = buildBaselineMetrics(input.userData);
  const parameters = buildROIParameters(input.userData);
  
  // Calculate implementation cost
  const implementationCost = calculateImplementationCost({
    dbaCount: baselineMetrics.dbaCount || 2,
    developerCount: baselineMetrics.developerCount || 5,
    dbaTrainingHours: Number(input.userData.dbaTrainingHours) || 10,
    developerTrainingHours: Number(input.userData.developerTrainingHours) || 5,
    dbaAnnualSalary: baselineMetrics.dbaAnnualSalary,
    developerAnnualSalary: baselineMetrics.developerAnnualSalary,
    flywayLicenseCost: baselineMetrics.flywayLicenseCost || 0
  });

  const finalMetrics: UserMetricsInput = {
    ...baselineMetrics,
    implementationCost
  };

  const currentMetrics: FlywayMetricsInput = {
    deploymentsPerQuarter: input.flywayDeploymentsPerQuarter,
    leadTimeDays: input.flywayLeadTime,
    scriptFailureRate: input.flywayFailureRate
  };

  return calculateROI(finalMetrics, currentMetrics, parameters);
}

/**
 * Validation warnings for unrealistic improvements
 */
export function validateROIAssumptions(params: {
  baselineLeadTime: number;
  flywayLeadTime: number;
  baselineFailureRate: number;
  flywayFailureRate: number;
  laborAutomationPct: number;
}): string[] {
  const warnings: string[] = [];

  // Check lead time improvement
  if (params.baselineLeadTime > 0 && params.flywayLeadTime >= 0) {
    const leadTimeReduction = ((params.baselineLeadTime - params.flywayLeadTime) / params.baselineLeadTime) * 100;
    if (leadTimeReduction > 70) {
      warnings.push(`Lead time improvement of ${leadTimeReduction.toFixed(0)}% is unusually high. Industry average is 40-60%.`);
    }
  }

  // Check labor automation
  if (params.laborAutomationPct > 50) {
    warnings.push(`Labor automation of ${params.laborAutomationPct}% may be optimistic. Realistic first-year adoption is typically 30-40%.`);
  }

  // Check failure rate improvement
  if (params.baselineFailureRate > 0 && params.flywayFailureRate >= 0) {
    const failureReduction = ((params.baselineFailureRate - params.flywayFailureRate) / params.baselineFailureRate) * 100;
    if (failureReduction > 80) {
      warnings.push(`Failure rate reduction of ${failureReduction.toFixed(0)}% is very aggressive. Typical improvements are 50-70%.`);
    }
  }

  return warnings;
}
