import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Grid, Box, CircularProgress, Divider, Link } from '@mui/material';

export default function ChangeInDeploymentMetricsWidget() {
  const [metrics, setMetrics] = useState(null);
  const [roi, setRoi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function fetchMetrics() {
      try {
        // Fetch Flyway deployments per quarter
        const flywayRes = await fetch('/api/metrics/deployments-per-quarter');
        const flywayData = flywayRes.ok ? await flywayRes.json() : {};
        
        // Fetch user-defined metrics (non-Flyway baseline)
        const userRes = await fetch('/api/user-defined-metrics');
        const userData = userRes.ok ? await userRes.json() : {};

        // Fetch Flyway lead times
        const leadTimesRes = await fetch('/api/metrics/lead-times');
        const leadTimesData = leadTimesRes.ok ? await leadTimesRes.json() : {};

        if (!mounted) return;

        // Calculate Flyway lead time average
        let flywayLeadTime = 0;
        const leadTimes = Array.isArray(leadTimesData?.leadTimes) ? leadTimesData.leadTimes : [];
        if (leadTimes.length) {
          const validTimes = leadTimes
            .map(lt => Number(lt.leadTimeDays))
            .filter(n => Number.isFinite(n) && n >= 0);
          if (validTimes.length) {
            flywayLeadTime = validTimes.reduce((sum, t) => sum + t, 0) / validTimes.length;
          }
        }

        // Get Flyway failure rate from history
        let flywayFailureRate = 0;
        try {
          const historyRes = await fetch('/api/flyway/history/all');
          const historyData = historyRes.ok ? await historyRes.json() : [];
          const history = Array.isArray(historyData) ? historyData : [];
          if (history.length) {
            const failed = history.filter(m => m.success === false).length;
            flywayFailureRate = (failed / history.length) * 100;
          }
        } catch (e) {
          console.warn('Failed to get failure rate:', e);
        }

        setMetrics({
          flywayDeployments: Number(flywayData?.deploymentsPerQuarter) || 0,
          nonFlywayDeployments: Number(userData?.deploymentsPerQuarter) || 0,
          flywayLeadTime: Math.round(flywayLeadTime * 10) / 10,
          nonFlywayLeadTime: Number(userData?.leadTimeDays) || 0,
          flywayFailureRate: Math.round(flywayFailureRate * 10) / 10,
          nonFlywayFailureRate: Number(userData?.scriptFailureRate) || 0,
          extrapolated: flywayData?.extrapolated || false
        });

        // Calculate ROI
        calculateROI(userData, flywayData.deploymentsPerQuarter, flywayLeadTime, flywayFailureRate);

        setLoading(false);
      } catch (err) {
        console.error('Change in deployment metrics error:', err);
        if (mounted) {
          setError(err.message || 'Failed to load metrics');
          setLoading(false);
        }
      }
    }

    function calculateROI(userData, flywayDeployments, flywayLeadTime, flywayFailureRate) {
      const deploymentsPerQuarter = flywayDeployments || 0;
      const leadTimeDays = flywayLeadTime || 0;
      const scriptFailureRate = flywayFailureRate || 0;
      
      const savingsPerDeployment = Number(userData?.savingsPerDeployment) || 1000;
      const implementationCost = Number(userData?.implementationCost) || 9751;
      
      const nonFlywayDeployments = Number(userData?.deploymentsPerQuarter) || 10;
      const nonFlywayLeadTime = Number(userData?.leadTimeDays) || 20;
      const nonFlywayFailureRate = Number(userData?.scriptFailureRate) || 5;

      // Time savings from reduced lead time
      const leadTimeReduction = Math.max(0, nonFlywayLeadTime - leadTimeDays);
      const timeSavingsPerQuarter = leadTimeReduction * deploymentsPerQuarter;
      
      // Cost savings from reduced failures
      const failureRateReduction = Math.max(0, nonFlywayFailureRate - scriptFailureRate) / 100;
      const failureSavingsPerQuarter = failureRateReduction * deploymentsPerQuarter * savingsPerDeployment;
      
      // Deployment efficiency savings
      const deploymentIncrease = Math.max(0, deploymentsPerQuarter - nonFlywayDeployments);
      const efficiencySavings = deploymentIncrease * (savingsPerDeployment * 0.5);

      // Total quarterly savings
      const totalQuarterlySavings = failureSavingsPerQuarter + efficiencySavings + (timeSavingsPerQuarter * 100);
      
      // Annual ROI
      const annualSavings = totalQuarterlySavings * 4;
      const netBenefit = annualSavings - implementationCost;
      const roiPercentage = implementationCost > 0 ? (netBenefit / implementationCost) * 100 : 0;

      setRoi({
        percentage: Math.round(roiPercentage),
        annual: Math.round(annualSavings),
        quarterly: Math.round(totalQuarterlySavings),
        paybackMonths: annualSavings > 0 ? Math.ceil((implementationCost / annualSavings) * 12) : 0
      });
    }

    fetchMetrics();
    return () => { mounted = false; };
  }, []);

  const MetricCard = ({ title, flywayValue, nonFlywayValue, unit, lowerIsBetter = false }) => {
    const diff = flywayValue - nonFlywayValue;
    const improved = lowerIsBetter ? diff < 0 : diff > 0;
    const color = improved ? 'success.main' : diff === 0 ? 'text.secondary' : 'error.main';

    return (
      <Card variant="outlined" sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>{title}</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Flyway</Typography>
              <Typography variant="h6">{flywayValue}{unit}</Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" color="text.secondary">Non-Flyway</Typography>
              <Typography variant="h6">{nonFlywayValue}{unit}</Typography>
            </Box>
          </Box>
          <Typography variant="body2" sx={{ color }}>
            {diff > 0 ? '+' : ''}{Math.round(diff * 10) / 10}{unit} {improved ? '✓' : diff === 0 ? '—' : '✗'}
          </Typography>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>Change in Deployment Metrics (Prod Only)</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          All metrics below are calculated using production environments only.
          {metrics?.extrapolated && ' If less than a full quarter of data is available, Deployments per Quarter is extrapolated from the available data.'}
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : metrics ? (
          <>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={4}>
                <MetricCard
                  title="Deployments per Quarter"
                  flywayValue={metrics.flywayDeployments}
                  nonFlywayValue={metrics.nonFlywayDeployments}
                  unit=""
                  lowerIsBetter={false}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <MetricCard
                  title="Lead Time (days)"
                  flywayValue={metrics.flywayLeadTime}
                  nonFlywayValue={metrics.nonFlywayLeadTime}
                  unit=" days"
                  lowerIsBetter={true}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <MetricCard
                  title="Script Failure Rate"
                  flywayValue={metrics.flywayFailureRate}
                  nonFlywayValue={metrics.nonFlywayFailureRate}
                  unit="%"
                  lowerIsBetter={true}
                />
              </Grid>
            </Grid>

            {roi && (
              <>
                <Divider sx={{ my: 3 }} />
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary" gutterBottom>
                    {roi.percentage}% ROI
                  </Typography>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    Annual savings: ${roi.annual.toLocaleString()} | Payback period: {roi.paybackMonths} months
                  </Typography>
                  <Link 
                    href="#/roi-calculation" 
                    underline="hover"
                    sx={{ 
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      '&:hover': { color: 'primary.dark' }
                    }}
                  >
                    How is this calculated?
                  </Link>
                </Box>
              </>
            )}
          </>
        ) : (
          <Typography>No data available</Typography>
        )}
      </CardContent>
    </Card>
  );
}