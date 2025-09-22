// ROI calculation and explanation utility for Flyway
function calculateFlywayROI({
  userMetrics,
  flywayMetrics
}) {
  // Parse and coerce values
  const deploymentsPerQuarter = Number(userMetrics.deploymentsPerQuarter);
  const flywayDeploymentsPerQuarter = Number(flywayMetrics.deploymentsPerQuarter);
  const leadTimeDays = Number(userMetrics.leadTimeDays);
  const flywayLeadTimeDays = Number(flywayMetrics.leadTimeDays);
  const deploymentDurationDays = Number(userMetrics.deploymentDurationDays);
  const peopleInvolved = Number(userMetrics.peopleInvolved);
  const averageSalary = Number(userMetrics.averageSalary);

  // Calculate cost per deployment (people * salary * duration)
  const costPerDeployment = (peopleInvolved * (averageSalary / 260) * deploymentDurationDays); // 260 workdays/year
  // Calculate total deployments per year
  const userDeploymentsPerYear = deploymentsPerQuarter * 4;
  const flywayDeploymentsPerYear = flywayDeploymentsPerQuarter * 4;

  // Calculate time savings per deployment (lead time reduction)
  const leadTimeSavings = Math.max(0, leadTimeDays - flywayLeadTimeDays);
  const valuePerDeployment = leadTimeSavings * (peopleInvolved * (averageSalary / 260));
  // Total value per year
  const annualValue = valuePerDeployment * flywayDeploymentsPerYear;

  // ROI = (Value from lead time savings) / (Cost of deployments w/ Flyway)
  const annualCost = costPerDeployment * flywayDeploymentsPerYear;
  const roi = annualCost > 0 ? (annualValue - annualCost) / annualCost : null;

  // Explanation blurb
  const explanation = `ROI is calculated as the net value of lead time savings (in dollars) divided by the total cost of deployments with Flyway. Value is based on the reduction in lead time per deployment, multiplied by the number of people involved, their average salary, and the number of deployments per year. Cost is the total salary cost for all deployments with Flyway. ROI = (Value - Cost) / Cost.`;

  return { roi, annualValue, annualCost, explanation };
}

module.exports = { calculateFlywayROI };
