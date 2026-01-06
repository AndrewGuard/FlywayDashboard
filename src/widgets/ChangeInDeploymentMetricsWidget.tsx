import React, { useEffect, useState, useRef } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Box, 
  CircularProgress, 
  Divider, 
  Link,
  IconButton,
  Tooltip
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { exportAsImage } from '../utils/exportUtils';

interface Metrics {
  flywayDeployments: number;
  nonFlywayDeployments: number;
  flywayLeadTime: number;
  nonFlywayLeadTime: number;
  flywayFailureRate: number;
  nonFlywayFailureRate: number;
  extrapolated: boolean;
}

interface ROI {
  percentage: number;
  annual: number;
  quarterly: number;
  paybackMonths: number;
  leadTimeSavings: number;
  failureSavings: number;
  frequencySavings: number;
}

export default function ChangeInDeploymentMetricsWidget() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [roi, setRoi] = useState<ROI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      await exportAsImage(cardRef.current, 'deployment-metrics-overview');
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

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

      const metricsData = {
        flywayDeployments: Number(flywayData?.deploymentsPerQuarter) || 0,
        nonFlywayDeployments: Number(userData?.deploymentsPerQuarter) || 10,
        flywayLeadTime: Math.round(flywayLeadTime * 10) / 10,
        nonFlywayLeadTime: Number(userData?.leadTimeDays) || 20,
        flywayFailureRate: Math.round(flywayFailureRate * 10) / 10,
        nonFlywayFailureRate: Number(userData?.scriptFailureRate) || 5,
        extrapolated: flywayData?.extrapolated || false
      };

      setMetrics(metricsData);

      // Calculate ROI
      calculateROI(userData, flywayData.deploymentsPerQuarter, flywayLeadTime, flywayFailureRate);

      setLoading(false);
    } catch (err) {
      console.error('Change in deployment metrics error:', err);
      setError((err as Error).message || 'Failed to load metrics');
      setLoading(false);
    }
  }

  function calculateROI(userData: any, flywayDeployments: number, flywayLeadTime: number, flywayFailureRate: number) {
    const deploymentsPerQuarter = flywayDeployments || 0;
    const leadTimeDays = flywayLeadTime || 0;
    const scriptFailureRate = flywayFailureRate || 0;
    
    const savingsPerDeployment = Number(userData?.savingsPerDeployment) || 1000;
    const implementationCost = Number(userData?.implementationCost) || 9751;
    const costOfDelayPerDay = Number(userData?.costOfDelayPerDay) || 250;
    
    const nonFlywayDeployments = Number(userData?.deploymentsPerQuarter) || 10;
    const nonFlywayLeadTime = Number(userData?.leadTimeDays) || 20;
    const nonFlywayFailureRate = Number(userData?.scriptFailureRate) || 5;

    // If no Flyway data yet, don't calculate ROI
    if (deploymentsPerQuarter === 0 && leadTimeDays === 0) {
      setRoi(null);
      return;
    }

    // Lead time savings (DORA-aligned)
    const leadTimeReduction = Math.max(0, nonFlywayLeadTime - leadTimeDays);
    const leadTimeSavingsPerDeployment = leadTimeReduction * costOfDelayPerDay;
    const totalLeadTimeSavingsPerQuarter = leadTimeSavingsPerDeployment * deploymentsPerQuarter;
    
    // Cost savings from reduced failures
    const failureRateReduction = Math.max(0, nonFlywayFailureRate - scriptFailureRate) / 100;
    const failureSavingsPerQuarter = failureRateReduction * deploymentsPerQuarter * savingsPerDeployment;
    
    // Deployment frequency increase (DORA elite: 1+ per day)
    const deploymentIncrease = Math.max(0, deploymentsPerQuarter - nonFlywayDeployments);
    const frequencySavings = deploymentIncrease * (savingsPerDeployment * 0.3);

    // Total quarterly savings
    const totalQuarterlySavings = 
      totalLeadTimeSavingsPerQuarter + 
      failureSavingsPerQuarter + 
      frequencySavings;
    
    // Annual ROI
    const annualSavings = totalQuarterlySavings * 4;
    const netBenefit = annualSavings - implementationCost;
    const roiPercentage = implementationCost > 0 ? (netBenefit / implementationCost) * 100 : 0;

    setRoi({
      percentage: Math.round(roiPercentage),
      annual: Math.round(annualSavings),
      quarterly: Math.round(totalQuarterlySavings),
      paybackMonths: annualSavings > 0 ? Math.ceil((implementationCost / annualSavings) * 12) : 0,
      leadTimeSavings: Math.round(totalLeadTimeSavingsPerQuarter),
      failureSavings: Math.round(failureSavingsPerQuarter),
      frequencySavings: Math.round(frequencySavings)
    });
  }

  const MetricCard = ({ title, flywayValue, nonFlywayValue, unit, lowerIsBetter = false }: {
    title: string;
    flywayValue: number;
    nonFlywayValue: number;
    unit: string;
    lowerIsBetter?: boolean;
  }) => {
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
    <Card ref={cardRef} sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">Change in Deployment Metrics (Prod Only)</Typography>
          <Tooltip title="Download as image">
            <IconButton onClick={handleExport} disabled={exporting} size="small">
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
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
                    href="/roi" 
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