import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { Line } from 'react-chartjs-2';
import './chartjsSetup'; // ensure Chart.js components are registered

export default function DeploymentSuccessRate() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [points, setPoints] = useState([]); // { date, successRate }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/flyway/history/all');
        if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
        const history = await res.json();

        // compute daily success rate from history entries if possible
        // Expect each entry to have: installed_on (date) and success flag or state
        const counts = {}; // date -> { success: n, total: n }
        (Array.isArray(history) ? history : []).forEach(m => {
          const inst = m.installed_on || m.installedOn || m.installed;
          if (!inst) return;
          const d = new Date(inst);
          if (Number.isNaN(d.getTime())) return;
          const key = d.toISOString().slice(0, 10);
          counts[key] = counts[key] || { success: 0, total: 0 };
          // determine success: look for success, success_flag, state, or assume success if no failure indicator
          const isSuccess = (m.success === true) || (m.state && String(m.state).toLowerCase() === 'success') || (m.status && String(m.status).toLowerCase() === 'success') || (m.error == null && m.outcome == null);
          counts[key].total += 1;
          if (isSuccess) counts[key].success += 1;
        });

        const dates = Object.keys(counts).sort();
        let pts = dates.map(date => {
          const c = counts[date];
          const rate = c.total ? (c.success / c.total) * 100 : null;
          return { date, successRate: Number.isFinite(rate) ? Number(rate) : null };
        });

        // If no data available, show two flat points so chart renders
        if (!pts.length) {
          const today = new Date().toISOString().slice(0, 10);
          pts = [{ date: today, successRate: null }, { date: today, successRate: null }];
        } else if (pts.length === 1) {
          const d = pts[0];
          const next = new Date(d.date);
          next.setDate(next.getDate() + 1);
          pts = [d, { ...d, date: next.toISOString().slice(0, 10) }];
        }

        if (mounted) {
          setPoints(pts);
          setError(null);
        }
      } catch (e) {
        console.warn('DeploymentSuccessRate load error', e);
        if (mounted) setError(e.message || 'Failed to load');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // chart data: convert nulls to zeros for rendering but mark in UI when truly missing
  const labels = points.map(p => p.date || '');
  const dataSeries = points.map(p => (Number.isFinite(Number(p.successRate)) ? Number(p.successRate) : 0));

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Deployment Success Rate (%)',
        data: dataSeries,
        borderColor: 'rgb(75,192,192)',
        backgroundColor: 'rgba(75,192,192,0.2)',
        tension: 0.2,
        fill: false,
      },
    ],
  };

  return (
    <Card sx={{ minWidth: 275, mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Deployment Success Rate
        </Typography>

        {loading ? (
          <Typography>Loading...</Typography>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <>
            <Box sx={{ height: 260 }}>
              <Line data={chartData} options={{
                responsive: true,
                plugins: { legend: { position: 'top' } },
                scales: {
                  x: { title: { display: true, text: 'Date' } },
                  y: {
                    title: { display: true, text: 'Success %' },
                    min: 0,
                    max: 100,
                  },
                },
              }} redraw={true} />
            </Box>
            <Box sx={{ mt: 1 }}>
              {points.every(p => p.successRate == null) ? (
                <Typography variant="body2" color="text.secondary">
                  No success/failure data available — showing placeholder line. Ensure flyway history includes success/state fields.
                </Typography>
              ) : (
                <Typography variant="body2">
                  Latest: {points[points.length - 1].successRate != null ? `${Math.round(points[points.length - 1].successRate)}%` : 'N/A'}
                </Typography>
              )}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
