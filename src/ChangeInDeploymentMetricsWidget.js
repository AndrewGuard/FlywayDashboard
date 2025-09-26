import React, { useEffect, useState } from 'react';
import { calculateFlywayMetrics } from './flywayMetricsUtil';
import { Card, CardContent, Typography, Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';

import { loadAllMetrics } from './metricsLoader';
import { calculateROI } from './roiUtil';

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

  const [annualValue, setAnnualValue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // compute deployments per quarter from raw flyway history rows
  const computeDeploymentsPerQuarter = (migrations = []) => {
    // normalize rows -> dates for versioned scripts only
    const dates = (Array.isArray(migrations) ? migrations : [])
      .map(m => {
        const version = m.version ?? m.version_number ?? m.version_number_string ?? null;
        if (!version) return null;
        const vstr = String(version).trim();
        if (!vstr || vstr.startsWith('U')) return null; // skip undo/repeatable/no-version
        const inst = m.installed_on || m.installedOn || m.installed || m.installedOnUtc || m.timestamp;
        if (!inst) return null;
        const d = new Date(inst);
        return Number.isFinite(d.getTime()) ? d.toISOString().slice(0,10) : null;
      })
      .filter(Boolean)
      .sort();

    if (!dates.length) {
      return { deploymentsPerQuarter: 0, extrapolated: false, availableDays: 0 };
    }

    const minDate = new Date(dates[0]);
    const maxDate = new Date(dates[dates.length - 1]);
    const msPerDay = 24 * 60 * 60 * 1000;
    const availableDays = Math.max(1, Math.round((maxDate - minDate) / msPerDay) + 1);

    const COUNT_QUARTER_DAYS = 90;

    if (availableDays >= COUNT_QUARTER_DAYS) {
      // use last 90 days count (sliding window up to maxDate)
      const windowStart = new Date(maxDate);
      windowStart.setDate(windowStart.getDate() - (COUNT_QUARTER_DAYS - 1));
      const windowStartKey = windowStart.toISOString().slice(0,10);
      const countLast90 = dates.filter(d => d >= windowStartKey).length;
      return { deploymentsPerQuarter: Math.round(countLast90), extrapolated: false, availableDays };
    }

    // not a full quarter -> extrapolate from availableDays to 90 days
    const totalCount = dates.length;
    const extrapolatedValue = Math.round((totalCount / availableDays) * COUNT_QUARTER_DAYS);
    return { deploymentsPerQuarter: extrapolatedValue, extrapolated: true, availableDays };
  };

  useEffect(() => {
    let mounted = true;
    async function fetchMetrics() {
      try {
        const { userData, flywayMetricsObj } = await loadAllMetrics();
        if (!mounted) return;
        if (userData) setUserMetrics(userData);
        if (flywayMetricsObj) setFlywayMetrics(flywayMetricsObj);

        // Build inputs for ROI util:
        // Prefer explicit values from user-defined metrics if present.
        const implCost = Number(userData?.implementationCost ?? userData?.estimatedImplementationCost ?? userData?.implementation_cost ?? NaN);
        const annualCost = Number(userData?.annualCost ?? userData?.annual_cost ?? userData?.annualCostIncludingImplementation ?? NaN);

        // If explicit valueToClient not provided, try to infer from savingsPerDeployment * deploymentsPerQuarter * 4 (quarter -> year)
        const savingPerDeployment = Number(userData?.savingPerDeployment ?? userData?.saving_per_deployment ?? NaN);
        const deploymentsPerQuarter = Number(
          userData?.deploymentsPerQuarter ??
          flywayMetricsObj?.deploymentsPerQuarter ??
          0
        );
        const inferredValueToClient = Number.isFinite(savingPerDeployment) && deploymentsPerQuarter > 0
          ? savingPerDeployment * deploymentsPerQuarter * 4 // annualized
          : NaN;

        const valueToClient = Number(userData?.valueToClient ?? userData?.value_to_client ?? userData?.annualSavings ?? inferredValueToClient);

        const roiResult = calculateROI({
          valueToClient,
          annualCost,
          implementationCost: implCost
        });

        if (!mounted) return;
        setRoi(roiResult);
      } catch (e) {
        console.error('fetchMetrics error', e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchMetrics();
    return () => { mounted = false; };
  }, []);

  // ensure renderRow and any chart use safe values
  const renderRowSafe = (key) => {
    const f = toNumOrNull(flywayMetrics?.[key]);
    const u = toNumOrNull(userMetrics?.[key]);

    // special handling for deploymentsPerQuarter to show extrapolated indicator
    let fDisplay = fmt1(f);
    if (key === 'deploymentsPerQuarter' && flywayMetrics?.deploymentsPerQuarterExtrapolated) {
      fDisplay = `${fDisplay}*`; // asterisk indicates extrapolated
    }

    const abs = (f !== null && u !== null) ? Math.abs(u - f) : null;
    const pct = (f !== null && u !== null && f !== 0) ? ((u - f) / Math.abs(f)) * 100 : null;
    return (
      <TableRow key={key}>
        <TableCell>{metricsLabels[key] ?? key}</TableCell>
        <TableCell align="right">{f !== null ? fDisplay : '-'}</TableCell>
        <TableCell align="right">{u !== null ? fmt1(u) : '-'}</TableCell>
        <TableCell align="right">{abs !== null ? Number(abs).toFixed(0) : '-'}</TableCell>
        <TableCell align="right">{pct !== null ? Number(pct).toFixed(0) + '%' : '-'}</TableCell>
      </TableRow>
    );
  };

  // add a footnote explaining the asterisk for extrapolated deployments
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
              <Typography variant="body2">
                ROI: {roi?.roiPercent != null ? `${roi.roiPercent.toFixed(1)}%` : '-'}
                <br />
                Value to Client: {roi?.valueToClient != null ? `$${roi.valueToClient.toFixed(3)}` : '-'}
                <br />
                Annual Cost: {roi?.annualCost != null ? `$${roi.annualCost.toFixed(3)}` : '-'}
                <br />
                Implementation Cost: {roi?.implementationCost != null ? `$${roi.implementationCost.toFixed(0)}` : '-'}
              </Typography>
            </Box>
            <Box sx={{ mt: 1 }}>
              {flywayMetrics?.deploymentsPerQuarterExtrapolated ? (
                <Typography variant="caption">* Deployments per Quarter extrapolated from {flywayMetrics.deploymentsPerQuarterAvailableDays} days of data.</Typography>
              ) : null}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ChangeInDeploymentMetricsWidget;
