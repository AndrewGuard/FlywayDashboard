// Utility to calculate ROI from user metrics (shared by all widgets)
export function calculateROI(userMetrics) {
  if (!userMetrics) return { roi: null, roiExplanation: 'Missing metrics' };
  const dbaCount = Number(userMetrics.dbaCount) || 0;
  const dbaTimeSavedPercent = Number(userMetrics.dbaTimeSavedPercent) || 0;
  const dbaSalary = Number(userMetrics.dbaSalary) || 0;
  const developerCount = Number(userMetrics.developerCount) || 0;
  const developerTimeSavedPercent = Number(userMetrics.developerTimeSavedPercent) || 0;
  const developerSalary = Number(userMetrics.developerSalary) || 0;
  const flywayLicensingCost = Number(userMetrics.flywayLicensingCost) || 0;
  const estimatedImplementationHours = Number(userMetrics.estimatedImplementationHours) || 100;
  // Proportionally split implementation hours by number of developers and DBAs
  const totalPeople = developerCount + dbaCount;
  let devImplCost = 0, dbaImplCost = 0;
  if (totalPeople > 0) {
    const devHours = estimatedImplementationHours * (developerCount / totalPeople);
    const dbaHours = estimatedImplementationHours * (dbaCount / totalPeople);
    devImplCost = (developerSalary / 2080) * devHours;
    dbaImplCost = (dbaSalary / 2080) * dbaHours;
  }
  const implementationCost = devImplCost + dbaImplCost;
  const dbaSavings = dbaCount * (dbaTimeSavedPercent / 100) * dbaSalary;
  const developerSavings = developerCount * (developerTimeSavedPercent / 100) * developerSalary;
  const annualValue = dbaSavings + developerSavings - implementationCost;
  const annualCost = flywayLicensingCost + implementationCost;
  const roi = annualCost > 0 ? (annualValue - annualCost) / annualCost : null;
  const explanation = `ROI is calculated as the sum of efficiency gains for DBAs and developers (headcount × percent time saved × salary), minus the Flyway licensing cost and estimated implementation cost. Implementation cost is based on estimated hours × blended DBA/developer rate. ROI = (Value - Cost) / Cost. Value is the sum of DBA and developer savings minus implementation cost. Cost is the Flyway licensing cost plus implementation cost.`;
  return { roi, annualValue, annualCost, implementationCost, roiExplanation: explanation };
}

// Example implementation (adjust as needed to match your actual logic)
export function calculateFlywayMetrics(flywayRaw) {
  // Calculate and return { leadTimeDays, ... } from flywayRaw
  if (!flywayRaw) return {};
  return {
    leadTimeDays: flywayRaw.leadTimeDays ?? null,
    deploymentsPerQuarter: flywayRaw.deploymentsPerQuarter ?? null,
    // ...add other metrics as needed
  };
}

export function calculateUserMetrics(userRaw) {
  // Calculate and return { leadTimeDays, ... } from userRaw
  if (!userRaw) return {};
  return {
    leadTimeDays: userRaw.leadTimeDays ?? null,
    deploymentsPerQuarter: userRaw.deploymentsPerQuarter ?? null,
    // ...add other metrics as needed
  };
}
