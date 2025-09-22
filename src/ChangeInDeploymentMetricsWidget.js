import React, { useEffect, useState } from 'react';
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

        // Only use prod data for metrics
        const prodKeys = Object.keys(flywayData).filter(k => k.toLowerCase().includes('prod'));
        const prodRows = prodKeys.map(k => flywayData[k]).flat();

        // Calculate deployments per quarter, lead time, failure rate for prod only
        let deployments = 0, failures = 0;
        let minDate = null, maxDate = null;
        prodRows.forEach(row => {
          if (row.type && row.type.toLowerCase() !== 'undo' && row.type.toLowerCase() !== 'undo_sql') {
            deployments++;
            if (row.success === false || row.success === 0) failures++;
            if (row.installed_on) {
              const d = new Date(row.installed_on).getTime();
              if (!isNaN(d)) {
                if (minDate === null || d < minDate) minDate = d;
                if (maxDate === null || d > maxDate) maxDate = d;
              }
            }
          }
        });
        // Extrapolate deployments per quarter if less than 90 days of data
        let deploymentsPerQuarter = deployments;
        let deploymentsExtrapolated = false;
        if (minDate !== null && maxDate !== null) {
          const daysSpan = (maxDate - minDate) / (1000 * 60 * 60 * 24);
          if (daysSpan < 90 && daysSpan > 1) {
            deploymentsPerQuarter = deployments * (90 / daysSpan);
            deploymentsExtrapolated = true;
          }
        }

        // Fetch migration-lead-times.json for lead time (days) average, prod only
        const leadTimesRes = await fetch('/server/migration-lead-times.json');
        const leadTimesData = await leadTimesRes.json();
        const prodLeadTimes = Object.entries(leadTimesData)
          .filter(([key, value]) => key.toLowerCase().includes('prod') && typeof value === 'number' && value >= 0)
          .map(([key, value]) => value);
        const leadTimeDays = prodLeadTimes.length > 0 ? prodLeadTimes.reduce((a, b) => a + b, 0) / prodLeadTimes.length : null;

        const scriptFailureRate = deployments > 0 ? (failures / deployments) * 100 : null;
        // Estimate deployment duration as the average of (completed_on - installed_on) for prod migrations
        let deploymentDurations = prodRows
          .filter(row => row.installed_on && row.completed_on)
          .map(row => {
            const start = new Date(row.installed_on).getTime();
            const end = new Date(row.completed_on).getTime();
            return !isNaN(start) && !isNaN(end) && end > start ? (end - start) / (1000 * 60 * 60 * 24) : null;
          })
          .filter(x => x !== null);
        const deploymentDurationDays = deploymentDurations.length > 0 ? deploymentDurations.reduce((a, b) => a + b, 0) / deploymentDurations.length : null;

        const flywayMetricsObj = { deploymentsPerQuarter, leadTimeDays, scriptFailureRate, deploymentsExtrapolated, deploymentDurationDays };
        setFlywayMetrics(flywayMetricsObj);

        // Save inferred metrics to backend
        await fetch('/server/flyway-inferred-metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deploymentsPerQuarter,
            leadTimeDays,
            deploymentDurationDays
          })
        });

        // Calculate ROI and fetch explanation using inferred metrics
        if (userData && flywayMetricsObj) {
          const roiRes = await fetch('/server/flyway-roi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              flywayMetrics: {
                deploymentsPerQuarter,
                leadTimeDays,
                deploymentDurationDays
              }
            })
          });
          if (roiRes.ok) {
            const roiData = await roiRes.json();
            setRoi(roiData.roi);
            setRoiExplanation(roiData.roiExplanation);
          }
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
                  ROI: <b>{(roi * 100).toFixed(1)}%</b> &nbsp;
                  <Button size="small" onClick={() => alert(roiExplanation)} sx={{ textTransform: 'none', ml: 1 }}>
                    How is this calculated?
                  </Button>
                </Typography>
              )}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ChangeInDeploymentMetricsWidget;
