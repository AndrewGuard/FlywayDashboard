// Utility to calculate ROI from user metrics (shared by all widgets)
export function calculateROI(input = {}) {
  // Accept explicit numbers if provided, otherwise allow callers to compute upstream.
  const valueToClient = Number(input.valueToClient ?? input.value_to_client ?? input.annualSavings ?? NaN);
  const annualCost = Number(input.annualCost ?? input.annual_cost ?? input.annualCostIncludingImplementation ?? NaN);
  const implementationCost = Number(input.implementationCost ?? input.implementation_cost ?? input.estimatedImplementationCost ?? NaN);

  const safeValueToClient = Number.isFinite(valueToClient) ? valueToClient : null;
  const safeAnnualCost = Number.isFinite(annualCost) ? annualCost : null;
  const safeImplementationCost = Number.isFinite(implementationCost) ? implementationCost : null;

  let roiPercent = null;
  if (safeValueToClient !== null && safeAnnualCost !== null && safeAnnualCost !== 0) {
    roiPercent = ((safeValueToClient - safeAnnualCost) / safeAnnualCost) * 100;
  }

  return {
    valueToClient: safeValueToClient,
    annualCost: safeAnnualCost,
    implementationCost: safeImplementationCost,
    roiPercent: Number.isFinite(roiPercent) ? roiPercent : null,
  };
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
