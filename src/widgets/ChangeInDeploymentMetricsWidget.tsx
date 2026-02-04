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
  Tooltip,
  Paper,
  Chip
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { exportAsImage } from '../utils/exportUtils';
import { calculateROI, UserMetricsInput, FlywayMetricsInput, ROIParameters, DEFAULT_ROI_PARAMETERS } from '../utils/roiCalculations';

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
  threeYearROI: number;
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
    
    // Listen for user metrics updates from ROI page
    const handleMetricsUpdate = () => {
      console.log('User metrics updated, refreshing widget...');
      fetchMetrics();
    };
    
    window.addEventListener('userMetricsUpdated', handleMetricsUpdate);
    
    return () => {
      window.removeEventListener('userMetricsUpdated', handleMetricsUpdate);
    };
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

      // Calculate ROI using shared utility
      if (userData && Object.keys(userData).length > 0) {
        const baselineMetrics: UserMetricsInput = {
          deploymentsPerQuarter: Number(userData.deploymentsPerQuarter) || 10,
          leadTimeDays: Number(userData.leadTimeDays) || 20,
          scriptFailureRate: Number(userData.scriptFailureRate) || 5,
          savingsPerDeployment: Number(userData.savingsPerDeployment) || 1000,
          implementationCost: 0, // Will be calculated dynamically below
          costOfDelayPerDay: Number(userData.costOfDelayPerDay) || 250,
          dbaHoursPerDeployment: Number(userData.dbaHoursPerDeployment) || 8,
          developerHoursPerDeployment: Number(userData.developerHoursPerDeployment) || 4,
          dbaAnnualSalary: Number(userData.dbaAnnualSalary) || 175000,
          developerAnnualSalary: Number(userData.developerAnnualSalary) || 155000,
          developerCount: Number(userData.developerCount) || 5,
          dbaCount: Number(userData.dbaCount) || 2,
          flywayLicenseCost: Number(userData.flywayLicenseCost) || ((Number(userData.developerCount) || 5) + (Number(userData.dbaCount) || 2)) * 3000
        };

        const currentMetrics: FlywayMetricsInput = {
          deploymentsPerQuarter: Number(flywayData?.deploymentsPerQuarter) || 0,
          leadTimeDays: flywayLeadTime || 0,
          scriptFailureRate: flywayFailureRate || 0
        };

        // Only calculate if we have actual Flyway data
        if (currentMetrics.deploymentsPerQuarter > 0 || currentMetrics.leadTimeDays > 0) {
          try {
            // Use the saved parameters, default to realistic preset
            const parameters: ROIParameters = {
              laborAutomationPct: userData.laborAutomationPct ?? DEFAULT_ROI_PARAMETERS.laborAutomationPct,
              failureCostMultiplier: userData.failureCostMultiplier ?? DEFAULT_ROI_PARAMETERS.failureCostMultiplier,
              costOfDelayMultiplier: userData.costOfDelayMultiplier ?? DEFAULT_ROI_PARAMETERS.costOfDelayMultiplier,
              deploymentValueFactor: userData.deploymentValueFactor ?? DEFAULT_ROI_PARAMETERS.deploymentValueFactor,
              rampUpFactor: userData.rampUpFactor ?? DEFAULT_ROI_PARAMETERS.rampUpFactor,
              leadTimeCapPct: userData.leadTimeCapPct ?? DEFAULT_ROI_PARAMETERS.leadTimeCapPct
            };
            
            // Calculate implementation cost based on training hours plus license (same as ROI page)
            const baselineROI = calculateROI(baselineMetrics, currentMetrics, DEFAULT_ROI_PARAMETERS);
            const dbaTrainingHours = Number(userData.dbaTrainingHours) || 10;
            const developerTrainingHours = Number(userData.developerTrainingHours) || 5;
            const dbaHourlyRate = (Number(userData.dbaAnnualSalary) || 175000) / 2080;
            const devHourlyRate = (Number(userData.developerAnnualSalary) || 155000) / 2080;
            const dbaTrainingCost = (Number(userData.dbaCount) || 2) * dbaTrainingHours * dbaHourlyRate;
            const devTrainingCost = (Number(userData.developerCount) || 5) * developerTrainingHours * devHourlyRate;
            const actualImplementationCost = dbaTrainingCost + devTrainingCost + (Number(userData.flywayLicenseCost) || 0);
            
            // Now calculate final ROI with training-based implementation cost
            const finalMetrics = { ...baselineMetrics, implementationCost: actualImplementationCost };
            const roiResult = calculateROI(finalMetrics, currentMetrics, parameters);
            if (roiResult) {
              setRoi({
                percentage: roiResult.roiPercentage,
                annual: roiResult.annualSavings,
                quarterly: roiResult.totalQuarterlySavings,
                paybackMonths: roiResult.paybackMonths,
                leadTimeSavings: roiResult.timeSavingsPerQuarter,
                failureSavings: roiResult.failureSavingsPerQuarter,
                frequencySavings: roiResult.efficiencySavings,
                threeYearROI: roiResult.threeYearROI
              });
            } else {
              setRoi(null);
            }
          } catch (roiError) {
            console.error('ROI calculation error:', roiError);
            setRoi(null);
          }
        } else {
          setRoi(null);
        }
      } else {
        setRoi(null);
      }

      setLoading(false);
    } catch (err) {
      console.error('Change in deployment metrics error:', err);
      setError((err as Error).message || 'Failed to load metrics');
      setLoading(false);
    }
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
                
                {/* ROI Summary */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={2.4}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'primary.lighter', textAlign: 'center', borderLeft: 4, borderColor: 'primary.main' }}>
                      <Typography variant="h5" color="primary.dark" fontWeight="bold">
                        {roi.percentage}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Year 1 ROI
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={2.4}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'success.lighter', textAlign: 'center', borderLeft: 4, borderColor: 'success.main' }}>
                      <Typography variant="h5" color="success.dark" fontWeight="bold">
                        {roi.threeYearROI}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        3-Year ROI
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={2.4}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'info.lighter', textAlign: 'center', borderLeft: 4, borderColor: 'info.main' }}>
                      <Typography variant="h6" color="info.dark" fontWeight="bold">
                        ${roi.annual.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Annual Savings
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={2.4}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.200', textAlign: 'center', borderLeft: 4, borderColor: 'grey.500' }}>
                      <Typography variant="h6" color="text.primary" fontWeight="bold">
                        ${roi.quarterly.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Quarterly Savings
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={2.4}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'warning.lighter', textAlign: 'center', borderLeft: 4, borderColor: 'warning.main' }}>
                      <Typography variant="h6" color="warning.dark" fontWeight="bold">
                        {roi.paybackMonths} mo
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Payback Period
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Savings Breakdown */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <TrendingUpIcon color="primary" />
                    <Typography variant="subtitle1" fontWeight="bold">
                      Quarterly Savings Breakdown
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} md={4}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Lead Time Reduction
                        </Typography>
                        <Typography variant="h6" color="primary.dark">
                          ${roi.leadTimeSavings.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {roi.quarterly > 0 ? Math.round((roi.leadTimeSavings / roi.quarterly) * 100) : 0}% of total savings
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Failure Rate Reduction
                        </Typography>
                        <Typography variant="h6" color="success.dark">
                          ${roi.failureSavings.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {roi.quarterly > 0 ? Math.round((roi.failureSavings / roi.quarterly) * 100) : 0}% of total savings
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Deployment Efficiency
                        </Typography>
                        <Typography variant="h6" color="info.dark">
                          ${roi.frequencySavings.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {roi.quarterly > 0 ? Math.round((roi.frequencySavings / roi.quarterly) * 100) : 0}% of total savings
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>

                {/* Call to Action */}
                <Paper elevation={0} sx={{ p: 2, mt: 2, bgcolor: 'primary.lighter', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                    <Box>
                      <Typography variant="body2" color="text.primary" fontWeight="bold">
                        Want to see the full ROI calculation?
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Customize your metrics and view detailed formulas, DORA benchmarks, and savings projections
                      </Typography>
                    </Box>
                    <Link 
                      href="/roi" 
                      underline="none"
                    >
                      <Chip 
                        label="View Full ROI Calculator" 
                        color="primary" 
                        clickable
                        sx={{ 
                          fontWeight: 'bold',
                          fontSize: '0.95rem',
                          py: 2.5,
                          px: 1,
                          height: 'auto'
                        }}
                      />
                    </Link>
                  </Box>
                </Paper>
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