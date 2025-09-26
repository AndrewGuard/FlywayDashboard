import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { Line } from 'react-chartjs-2';

/**
 * Deployments Over Time
 * - Prefer cached data from backend: GET /api/cache/deployments-over-time
 * - If no cache, fetch flyway history, compute daily counts for versioned scripts (exclude undo 'U' entries),
 *   store results to /server/deployments-over-time.json via POST /api/cache/deployments-over-time
 */

export default function DeploymentsOverTimeWidget() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dailyPoints, setDailyPoints] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        // Try cached JSON first
        const cacheRes = await fetch('/api/cache/deployments-over-time');
        if (cacheRes.ok) {
          let cached = { points: [] };
          try {
            // handle empty body or invalid JSON safely
            const text = await cacheRes.text();
            cached = text ? JSON.parse(text) : { points: [] };
          } catch (e) {
            console.warn('Invalid cache JSON, falling back to empty', e);
            cached = { points: [] };
          }
          if (mounted && Array.isArray(cached.points) && cached.points.length) {
            setDailyPoints(cached.points);
            setLoading(false);
            return;
          }
        }

        // No cache or empty -> fetch full flyway history
        const res = await fetch('/api/flyway/history/all');
        if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
        const migrations = await res.json();

        // Count only versioned scripts (exclude entries where version is null/empty or starts with 'U')
        const counts = {};
        (Array.isArray(migrations) ? migrations : []).forEach(m => {
          const version = m.version ?? m.version_number ?? null;
          if (!version) return; // skip repeatable or no-version
          const vstr = String(version);
          if (vstr.trim() === '') return;
          if (vstr.startsWith('U')) return; // exclude undo migrations
          const inst = m.installed_on || m.installedOn || m.installedOnUtc || m.installed;
          if (!inst) return;
          const d = new Date(inst);
          if (Number.isNaN(d.getTime())) return;
          const key = d.toISOString().slice(0, 10);
          counts[key] = (counts[key] || 0) + 1;
        });

        const dates = Object.keys(counts).sort();
        let points = dates.map(date => ({ date, count: counts[date] }));

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

        if (mounted) setDailyPoints(points);

        // persist cache to backend file for quicker loading next time
        try {
          await fetch('/api/cache/deployments-over-time', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ points }),
          });
        } catch (e) {
          // non-fatal: cache write failure shouldn't block UI
          console.warn('failed to save deployments-over-time cache', e);
        }
      } catch (e) {
        if (mounted) setError(e.message || 'Failed to load deployments');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, []);

  const chartData = {
    labels: dailyPoints.map(p => p.date),
    datasets: [
      {
        label: 'Deployments (per day, versioned scripts only)',
        data: dailyPoints.map(p => p.count),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.2,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { position: 'top' }, title: { display: false } },
    scales: {
      x: { title: { display: true, text: 'Date' } },
      y: { title: { display: true, text: 'Deployments' }, beginAtZero: true }
    }
  };

  return (
    <Card sx={{ minWidth: 275, mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Deployments Over Time
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
                options={chartOptions}
                redraw={true}
              />
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Daily counts include only versioned migrations (exclude undo 'U' scripts). Cached data stored for quicker loads.
              </Typography>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
