// Utility to calculate ROI from user and flyway metrics
export function calculateROI(userMetrics, flywayMetrics) {
  if (!userMetrics || !flywayMetrics) return { roi: null, roiExplanation: 'Missing metrics' };
  // Parse and coerce values
  const deploymentsPerQuarter = Number(userMetrics.deploymentsPerQuarter);
  const flywayDeploymentsPerQuarter = Number(flywayMetrics.deploymentsPerQuarter);
  const leadTimeDays = Number(userMetrics.leadTimeDays);
  const flywayLeadTimeDays = Number(flywayMetrics.leadTimeDays);
  const peopleInvolved = Number(userMetrics.peopleInvolved);
  const averageSalary = Number(userMetrics.averageSalary);
  const scriptFailureRate = Number(userMetrics.scriptFailureRate);
  const flywayScriptFailureRate = Number(flywayMetrics.scriptFailureRate);

  // Calculate cost per deployment (people * salary * duration)
  // Use lead time as a proxy for deployment duration if not available
  const deploymentDurationDays = Number(userMetrics.deploymentDurationDays) || leadTimeDays;
  const costPerDeployment = (peopleInvolved * (averageSalary / 260) * deploymentDurationDays); // 260 workdays/year
  // Calculate total deployments per year
  const userDeploymentsPerYear = deploymentsPerQuarter * 4;
  const flywayDeploymentsPerYear = flywayDeploymentsPerQuarter * 4;

  // Calculate time savings per deployment (lead time reduction)
  const leadTimeSavings = Math.max(0, leadTimeDays - flywayLeadTimeDays);
  const valuePerDeployment = leadTimeSavings * (peopleInvolved * (averageSalary / 260));
  // Value from increased deployments
  const deploymentIncreaseValue = (flywayDeploymentsPerYear - userDeploymentsPerYear) * costPerDeployment * 0.5; // Assume 50% of cost is value for new deployments
  // Value from reduced script failure rate
  const failureRateSavings = Math.max(0, scriptFailureRate - flywayScriptFailureRate) / 100 * flywayDeploymentsPerYear * costPerDeployment * 0.5; // Assume 50% of cost is saved per avoided failure

  // Total value per year
  const annualValue = (valuePerDeployment * flywayDeploymentsPerYear) + deploymentIncreaseValue + failureRateSavings;

  // ROI = (Value from all improvements) / (Cost of deployments w/ Flyway)
  const annualCost = costPerDeployment * flywayDeploymentsPerYear;
  const roi = annualCost > 0 ? (annualValue - annualCost) / annualCost : null;

  // Explanation blurb
  const explanation = `ROI is calculated as the net value of improvements (lead time reduction, more deployments, and fewer failures) divided by the total cost of deployments with Flyway. Value is based on: (1) reduction in lead time per deployment, (2) increase in deployments per year, and (3) reduction in script failure rate. Each is multiplied by the number of people involved, their average salary, and the number of deployments per year. Cost is the total salary cost for all deployments with Flyway. ROI = (Value - Cost) / Cost.`;

  return { roi, annualValue, annualCost, roiExplanation: explanation };
}
