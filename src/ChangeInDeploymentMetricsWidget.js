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
        // Calculate deployments per quarter, lead time, failure rate
        let deployments = 0, failures = 0, totalLeadTime = 0, leadTimeCount = 0;
        Object.values(flywayData).flat().forEach(row => {
          if (row.type && row.type.toLowerCase() !== 'undo' && row.type.toLowerCase() !== 'undo_sql') {
            deployments++;
            if (row.success === false || row.success === 0) failures++;
            if (row.installed_on && row.completed_on) {
              const start = new Date(row.installed_on).getTime();
              const end = new Date(row.completed_on).getTime();
              if (!isNaN(start) && !isNaN(end) && end > start) {
                totalLeadTime += (end - start) / (1000 * 60 * 60 * 24); // days
                leadTimeCount++;
              }
            }
          }
        });
        // Assume 1 quarter = 90 days, so deployments per quarter = deployments in last 90 days
        let deploymentsPerQuarter = deployments;
        // If you want to filter by last 90 days, uncomment below:
        // const now = Date.now();
        // deploymentsPerQuarter = Object.values(flywayData).flat().filter(row => {
        //   const d = new Date(row.installed_on).getTime();
        //   return !isNaN(d) && (now - d) < 90 * 24 * 60 * 60 * 1000;
        // }).length;
        const leadTimeDays = leadTimeCount > 0 ? totalLeadTime / leadTimeCount : null;
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
            Change in Deployment Metrics
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
