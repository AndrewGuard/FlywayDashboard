import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { Line } from 'react-chartjs-2';
import { loadAllMetrics } from './metricsLoader';

const HISTORY_KEY = 'leadTimeDeltaHistoryV2';

export function saveLeadTimeDeltaHistory(delta, flywayLeadTime, userLeadTime) {
  const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  const date = new Date().toISOString().slice(0, 10);

  const dNum = Number(delta);
  const fNum = Number(flywayLeadTime);
  const uNum = Number(userLeadTime);

  // only push numeric values (use null if invalid)
  const entry = {
    date,
    delta: Number.isFinite(dNum) ? dNum : null,
    flywayLeadTime: Number.isFinite(fNum) ? fNum : null,
    userLeadTime: Number.isFinite(uNum) ? uNum : null,
  };

  if (
    !history.length ||
    history[history.length - 1].date !== date ||
    history[history.length - 1].delta !== entry.delta
  ) {
    history.push(entry);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }
}

export async function getLeadTimeDeltaHistory() {
  return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
}

const LeadTimeForChangesOverTimeWidget = () => {
  const [history, setHistory] = useState([]);
  const [flywayMetrics, setFlywayMetrics] = useState(null);
  const [userMetrics, setUserMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  // load metrics once
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { userData, flywayMetricsObj } = await loadAllMetrics();
        if (!mounted) return;
        if (userData) setUserMetrics(userData);
        if (flywayMetricsObj) setFlywayMetrics(flywayMetricsObj);
      } catch (e) {
        console.error('loadAllMetrics error', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // derive current lead times and delta (coerce to numbers or null)
  const flywayLeadTime = (flywayMetrics && flywayMetrics.leadTimeDays != null)
    ? Number(flywayMetrics.leadTimeDays)
    : null;
  const userLeadTime = (userMetrics && userMetrics.leadTimeDays != null)
    ? Number(userMetrics.leadTimeDays)
    : null;
  const delta = (flywayLeadTime !== null && userLeadTime !== null)
    ? (userLeadTime - flywayLeadTime)
    : null;

  // persist current delta to history when available
  useEffect(() => {
    if (delta !== null && flywayLeadTime !== null && userLeadTime !== null) {
      saveLeadTimeDeltaHistory(delta, flywayLeadTime, userLeadTime);
      // refresh local history state after save
      getLeadTimeDeltaHistory().then(setHistory).catch(() => setHistory([]));
    }
  }, [delta, flywayLeadTime, userLeadTime]);

  // initial load of history
  useEffect(() => {
    getLeadTimeDeltaHistory().then((h) => {
      setHistory(h || []);
    }).catch(() => setHistory([]));
  }, []);

  // prepare chart history: if empty but current delta exists, show current point;
  // if only one point, duplicate with next day to render a flat line
  let chartHistory = Array.isArray(history) ? [...history] : [];
  if (!chartHistory.length && delta !== null) {
    chartHistory = [{ date: new Date().toISOString().slice(0, 10), delta, flywayLeadTime, userLeadTime }];
  }
  if (chartHistory.length === 1) {
    const d = chartHistory[0];
    const nextDate = new Date(d.date);
    nextDate.setDate(nextDate.getDate() + 1);
    chartHistory = [
      d,
      { ...d, date: nextDate.toISOString().slice(0, 10) }
    ];
  }

  // helper to format numeric values safely
  const fmt = (v) => (v === null || v === undefined || !Number.isFinite(Number(v))) ? '-' : Number(v).toFixed(2);

  const chartData = {
    labels: chartHistory.map(d => d.date),
    datasets: [
      {
        label: 'Lead Time (Flyway)',
        data: chartHistory.map(d => (Number.isFinite(Number(d.flywayLeadTime)) ? Number(d.flywayLeadTime) : null)),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.2,
        fill: false,
      },
      {
        label: 'Lead Time (Non-Flyway)',
        data: chartHistory.map(d => (Number.isFinite(Number(d.userLeadTime)) ? Number(d.userLeadTime) : null)),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.2,
        fill: false,
      },
      {
        label: 'Delta (User - Flyway)',
        data: chartHistory.map(d => (Number.isFinite(Number(d.delta)) ? Number(d.delta) : null)),
        borderColor: 'rgb(255, 206, 86)',
        backgroundColor: 'rgba(255, 206, 86, 0.2)',
        tension: 0.2,
        fill: false,
        hidden: true,
      },
    ],
  };

  return (
    <Card sx={{ minWidth: 275, mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Lead Time for Changes
        </Typography>
        {loading ? (
          <Typography>Loading...</Typography>
        ) : (
          <>
            <Box sx={{ height: 300 }}>
              <Line
                data={chartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'top' },
                    title: { display: false }
                  },
                  scales: {
                    x: { title: { display: true, text: 'Date' } },
                    y: { title: { display: true, text: 'Lead Time (days)' }, beginAtZero: true }
                  }
                }}
              />
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Current Lead Time (Flyway):</strong> {fmt(flywayLeadTime)} days<br />
                <strong>Current Lead Time (Non-Flyway):</strong> {fmt(userLeadTime)} days<br />
                <strong>Current Delta:</strong> {fmt(delta)} days
              </Typography>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default LeadTimeForChangesOverTimeWidget;