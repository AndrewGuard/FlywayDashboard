import React, { useEffect, useState } from 'react';
import { calculateFlywayMetrics } from './flywayMetricsUtil';
import { calculateROI } from './roiUtil';
import { Card, CardContent, Typography, Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';

function percentChange(current, previous) {
  if (previous === 0 || previous === null || previous === undefined) return null;
  return ((current - previous) / previous) * 100;
}

const metricsLabels = {
  deploymentsPerQuarter: 'Deployments per Quarter',
  leadTimeDays: 'Lead Time for Changes (days)',
  scriptFailureRate: 'Script Failure Rate (%)',
};

const ChangeInDeploymentMetricsWidget = () => {
  const [flywayMetrics, setFlywayMetrics] = useState(null);
  const [userMetrics, setUserMetrics] = useState(null);
  const [roi, setRoi] = useState(null);
  const [roiExplanation, setRoiExplanation] = useState('');
  const [annualValue, setAnnualValue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMetrics() {
      setLoading(true);
      setError(null);
      try {
        // Fetch user-defined metrics
        const userRes = await fetch('/api/user-defined-metrics');
        const userData = await userRes.json();
        setUserMetrics(userData);

        // Fetch Flyway metrics (calculate from history)
        const flywayRes = await fetch('/api/flyway/history/all');
        const flywayData = await flywayRes.json();

        // Fetch migration-lead-times.json for lead time (days) average, prod only
        const leadTimesRes = await fetch('/server/migration-lead-times.json');
        const leadTimesData = await leadTimesRes.json();

        // Use shared utility for Flyway metrics
        const flywayMetricsObj = calculateFlywayMetrics(flywayData, leadTimesData);
        setFlywayMetrics(flywayMetricsObj);

        // Save inferred metrics to backend
        await fetch('/server/flyway-inferred-metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(flywayMetricsObj)
        });

        // Calculate ROI on the client using available fields
        if (userData && flywayMetricsObj) {
          const roiResult = calculateROI(userData, flywayMetricsObj);
          setRoi(roiResult.roi);
          setRoiExplanation(roiResult.roiExplanation);
          setAnnualValue(roiResult.annualValue);
        }
      } catch (e) {
        setError('Failed to load metrics');
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  const renderRow = (key) => {
    const flyway = flywayMetrics?.[key] ?? null;
    const user = userMetrics?.[key] ?? null;
    const absChange = flyway !== null && user !== null ? flyway - user : null;
    const pctChange = flyway !== null && user !== null ? percentChange(flyway, user) : null;
    let flywayDisplay = flyway !== null ? flyway.toFixed(2) : '-';
    if (key === 'deploymentsPerQuarter' && flyway !== null && flywayMetrics?.deploymentsExtrapolated) {
      flywayDisplay += ' (extrapolated)';
    }
    return (
      <TableRow key={key}>
        <TableCell>{metricsLabels[key]}</TableCell>
        <TableCell align="right" sx={{ fontWeight: 600, color: 'primary.main' }}>{flywayDisplay}</TableCell>
        <TableCell align="right" sx={{ color: 'secondary.main' }}>{user !== null ? user : '-'}</TableCell>
        <TableCell align="right">{absChange !== null ? absChange.toFixed(2) : '-'}</TableCell>
        <TableCell align="right">{pctChange !== null ? pctChange.toFixed(1) + '%' : '-'}</TableCell>
      </TableRow>
    );
  };

  return (
    <Card sx={{ minWidth: 275, mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" gutterBottom>
            Change in Deployment Metrics (Prod Only)
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<SettingsIcon />}
            href="#/user-defined-metrics"
            sx={{ ml: 2 }}
          >
            Configure
          </Button>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
          All metrics below are calculated using <b>production</b> environments only.<br/>
          If less than a full quarter of data is available, <b>Deployments per Quarter</b> is extrapolated from the available data.
        </Typography>
        {loading ? (
          <Typography>Loading...</Typography>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <>
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Metric</TableCell>
                    <TableCell align="right">Flyway</TableCell>
                    <TableCell align="right">Non Flyway</TableCell>
                    <TableCell align="right">Δ (Abs)</TableCell>
                    <TableCell align="right">Δ (%)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {['deploymentsPerQuarter', 'leadTimeDays', 'scriptFailureRate'].map(renderRow)}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Expected Value to Business (ROI)
              </Typography>
              {roi !== null && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  ROI: <b>{(roi * 100).toFixed(1)}%</b>
                </Typography>
              )}
              {annualValue !== null && (
                <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                  Expected Value to Business (Annual):
                  <span style={{ fontWeight: 700, fontSize: '1.25em', marginLeft: 8 }}>
                    ${annualValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </Typography>
              )}
              <Button size="small" onClick={() => { window.location.hash = '#/roi-calculation'; }} sx={{ textTransform: 'none', ml: 1 }}>
                How is this calculated?
              </Button>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ChangeInDeploymentMetricsWidget;
