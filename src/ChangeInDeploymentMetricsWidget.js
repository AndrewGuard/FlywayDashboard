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
        prodRows.forEach(row => {
          if (row.type && row.type.toLowerCase() !== 'undo' && row.type.toLowerCase() !== 'undo_sql') {
            deployments++;
            if (row.success === false || row.success === 0) failures++;
          }
        });
        // Assume 1 quarter = 90 days, so deployments per quarter = deployments in last 90 days
        let deploymentsPerQuarter = deployments;
        // If you want to filter by last 90 days, uncomment below:
        // const now = Date.now();
        // deploymentsPerQuarter = prodRows.filter(row => {
        //   const d = new Date(row.installed_on).getTime();
        //   return !isNaN(d) && (now - d) < 90 * 24 * 60 * 60 * 1000;
        // }).length;

        // Fetch migration-lead-times.json for lead time (days) average, prod only
        const leadTimesRes = await fetch('/server/migration-lead-times.json');
        const leadTimesData = await leadTimesRes.json();
        const prodLeadTimes = Object.entries(leadTimesData)
          .filter(([key, value]) => key.toLowerCase().includes('prod') && typeof value === 'number' && value >= 0)
          .map(([key, value]) => value);
        const leadTimeDays = prodLeadTimes.length > 0 ? prodLeadTimes.reduce((a, b) => a + b, 0) / prodLeadTimes.length : null;

        const scriptFailureRate = deployments > 0 ? (failures / deployments) * 100 : null;
        setFlywayMetrics({ deploymentsPerQuarter, leadTimeDays, scriptFailureRate });
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
    return (
      <TableRow key={key}>
        <TableCell>{metricsLabels[key]}</TableCell>
        <TableCell align="right" sx={{ fontWeight: 600, color: 'primary.main' }}>{flyway !== null ? flyway.toFixed(2) : '-'}</TableCell>
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
          All metrics below are calculated using <b>production</b> environments only.
        </Typography>
        {loading ? (
          <Typography>Loading...</Typography>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Metric</TableCell>
                  <TableCell align="right">Flyway</TableCell>
                  <TableCell align="right">User</TableCell>
                  <TableCell align="right">Δ (Abs)</TableCell>
                  <TableCell align="right">Δ (%)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {['deploymentsPerQuarter', 'leadTimeDays', 'scriptFailureRate'].map(renderRow)}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default ChangeInDeploymentMetricsWidget;
