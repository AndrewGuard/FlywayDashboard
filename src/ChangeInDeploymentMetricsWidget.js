import React, { useEffect, useState } from 'react';
import { calculateFlywayMetrics } from './flywayMetricsUtil';
import { Card, CardContent, Typography, Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';

import { calculateROI } from './roiUtil';
import { loadAllMetrics } from './metricsLoader';

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

  // safe number helpers to avoid crashes when data is missing/invalid
  const toNumOrNull = (v) => {
    if (v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  // format numbers to 0 decimal places (nearest whole number) for display in this widget
  const fmt1 = (v) => (v === null || v === undefined) ? '-' : (Number.isFinite(Number(v)) ? Number(v).toFixed(0) : '-');

  // wrapper to ensure chart datasets always have at least two numeric points
  const ensureChartSeries = (arr, fallback = 0) => {
    const numeric = (arr || []).map(x => (Number.isFinite(Number(x)) ? Number(x) : null));
    const filtered = numeric.filter(x => x !== null);
    if (!filtered.length) {
      // return two identical fallback points so chart renders as flat line
      return [fallback, fallback];
    }
    if (filtered.length === 1) {
      return [filtered[0], filtered[0]];
    }
    return numeric.map((x, i) => (x === null ? (i ? numeric[i - 1] ?? fallback : fallback) : x));
  };

  const [flywayMetrics, setFlywayMetrics] = useState(null);
  const [userMetrics, setUserMetrics] = useState(null);
  const [roi, setRoi] = useState(null);
  const [roiExplanation, setRoiExplanation] = useState('');
  const [annualValue, setAnnualValue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function fetchMetrics() {
      try {
        const { userData, flywayRaw, leadTimesData, flywayMetricsObj } = await loadAllMetrics();
        if (!mounted) return;
        if (userData) setUserMetrics(userData);
        if (flywayMetricsObj) setFlywayMetrics(flywayMetricsObj);
      } catch (e) {
        console.error('fetchMetrics error', e);
        if (mounted) setError('Failed to load metrics');
      } finally {
        if (mounted) setLoading(false); // <- ensure loading is cleared regardless of success/failure
      }
    }
    fetchMetrics();
    return () => { mounted = false; };
  }, []);
  // ensure renderRow and any chart use safe values
  const renderRowSafe = (key) => {
    const f = toNumOrNull(flywayMetrics?.[key]);
    const u = toNumOrNull(userMetrics?.[key]);
    const abs = (f !== null && u !== null) ? Math.abs(u - f) : null;
    const pct = (f !== null && u !== null && f !== 0) ? ((u - f) / Math.abs(f)) * 100 : null;
    return (
      <TableRow key={key}>
        <TableCell>{metricsLabels[key] ?? key}</TableCell>
        <TableCell align="right">{fmt1(f)}</TableCell>
        <TableCell align="right">{fmt1(u)}</TableCell>
        <TableCell align="right">{abs !== null ? Number(abs).toFixed(0) : '-'}</TableCell>
        <TableCell align="right">{pct !== null ? Number(pct).toFixed(0) + '%' : '-'}</TableCell>
      </TableRow>
    );
  };
  
  // If there are charts in this widget, build chart data safely here (example)
  const deploymentsSeriesFlyway = ensureChartSeries([ flywayMetrics?.deploymentsPerQuarter ], 0);
  const deploymentsSeriesUser = ensureChartSeries([ userMetrics?.deploymentsPerQuarter ], 0);

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
                  {['deploymentsPerQuarter', 'leadTimeDays', 'scriptFailureRate'].map(renderRowSafe)}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Expected Value to Client (ROI)
              </Typography>
              {roi !== null && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  ROI: <b>{(roi * 100).toFixed(1)}%</b>
                </Typography>
              )}
              {annualValue !== null && (
                <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                  Expected Value to Client (Annual):
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
