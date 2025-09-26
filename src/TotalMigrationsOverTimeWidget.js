import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { Line } from 'react-chartjs-2';

/**
 * Total Migrations Over Time
 * - Fetches flyway history from /api/flyway/history/all
 * - Groups by installed_on date (YYYY-MM-DD)
 * - Renders daily totals as a line chart (shows at least the current point if no history)
 */

export default function TotalMigrationsOverTimeWidget() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dailyPoints, setDailyPoints] = useState([]); // {date, count}

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/flyway/history/all');
        if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
        const migrations = await res.json();

        // migrations expected to include installed_on (ISO) or similar
        const counts = {};
        (Array.isArray(migrations) ? migrations : []).forEach(m => {
          const inst = m.installed_on || m.installedOn || m.installedOnUtc || m.installed; // try variants
          if (!inst) return;
          const d = new Date(inst);
          if (Number.isNaN(d.getTime())) return;
          const key = d.toISOString().slice(0, 10);
          counts[key] = (counts[key] || 0) + 1;
        });

        // create sorted array
        const dates = Object.keys(counts).sort();
        let points = dates.map(date => ({ date, count: counts[date] }));

        // If no data, but server returned something empty, show current zero point
        if (!points.length) {
          const today = new Date().toISOString().slice(0, 10);
          points = [{ date: today, count: 0 }];
        }

        // ensure at least two points for Chart.js flat line rendering
        if (points.length === 1) {
          const next = new Date(points[0].date);
          next.setDate(next.getDate() + 1);
          points = [...points, { date: next.toISOString().slice(0, 10), count: points[0].count }];
        }

        if (mounted) {
          setDailyPoints(points);
          setError(null);
        }
      } catch (e) {
        if (mounted) setError(e.message || 'Failed to load migrations');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const chartData = {
    labels: dailyPoints.map(p => p.date),
    datasets: [
      {
        label: 'Migrations (per day)',
        data: dailyPoints.map(p => p.count),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.2,
        fill: true,
      },
    ],
  };

  return (
    <Card sx={{ minWidth: 275, mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Total Migrations Over Time
        </Typography>

        {loading ? (
          <Typography>Loading...</Typography>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <>
            <Box sx={{ height: 300 }}>
              <Line
                data={chartData}
                options={{
                  responsive: true,
                  plugins: { legend: { position: 'top' }, title: { display: false } },
                  scales: {
                    x: { title: { display: true, text: 'Date' } },
                    y: { title: { display: true, text: 'Migrations' }, beginAtZero: true }
                  }
                }}
              />
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Daily migration counts derived from Flyway history installed_on timestamps.
              </Typography>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}