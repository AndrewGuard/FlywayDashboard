// Utility to calculate ROI from user and flyway metrics
export function calculateROI(userMetrics, flywayMetrics) {
  if (!userMetrics) return { roi: null, roiExplanation: 'Missing metrics' };
  // Parse and coerce values for new efficiency model
  const dbaCount = Number(userMetrics.dbaCount) || 0;
  const dbaTimeSavedPercent = Number(userMetrics.dbaTimeSavedPercent) || 0;
  const dbaSalary = Number(userMetrics.dbaSalary) || 0;
  const developerCount = Number(userMetrics.developerCount) || 0;
  const developerTimeSavedPercent = Number(userMetrics.developerTimeSavedPercent) || 0;
  const developerSalary = Number(userMetrics.developerSalary) || 0;
  const flywayLicensingCost = Number(userMetrics.flywayLicensingCost) || 0;

  // Calculate efficiency savings
  const dbaSavings = dbaCount * (dbaTimeSavedPercent / 100) * dbaSalary;
  const developerSavings = developerCount * (developerTimeSavedPercent / 100) * developerSalary;
  const annualValue = dbaSavings + developerSavings;
  const annualCost = flywayLicensingCost;
  const roi = annualCost > 0 ? (annualValue - annualCost) / annualCost : null;

  // Explanation blurb
  const explanation = `ROI is calculated as the sum of efficiency gains for DBAs and developers (headcount × percent time saved × salary), minus the Flyway licensing cost. ROI = (Value - Cost) / Cost. Value is the sum of DBA and developer savings. Cost is the Flyway licensing cost.`;

  return { roi, annualValue, annualCost, roiExplanation: explanation };
}
