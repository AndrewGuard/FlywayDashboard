import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function MetricsChart() {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        const res = await fetch('/api/flyway/history/all');
        if (!res.ok) throw new Error('Failed to fetch migration history');
        
        const data = await res.json();
        
        if (!mounted) return;

        const migrations = Array.isArray(data) ? data : [];
        
        if (!migrations.length) {
          setError('No migration data available');
          setLoading(false);
          return;
        }

        // Group by month
        const byMonth = {};
        migrations.forEach(m => {
          const dateStr = m.installed_on || m.installedOn;
          if (!dateStr) return;
          const month = new Date(dateStr).toISOString().slice(0, 7);
          byMonth[month] = (byMonth[month] || 0) + 1;
        });

        const labels = Object.keys(byMonth).sort();
        const values = labels.map(m => byMonth[m]);

        setChartData({
          labels,
          datasets: [{
            label: 'Migrations per Month',
            data: values,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            tension: 0.1
          }]
        });

        setLoading(false);
      } catch (err) {
        console.error('Metrics chart error:', err);
        if (mounted) {
          setError(err.message || 'Failed to load data');
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => { mounted = false; };
  }, []);

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Migration Activity Over Time' }
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Migrations' } },
      x: { title: { display: true, text: 'Month' } }
    }
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>Migration Activity</Typography>
        {loading ? (
          <Typography>Loading...</Typography>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : chartData ? (
          <Box sx={{ height: 300 }}><Line data={chartData} options={options} /></Box>
        ) : (
          <Typography>No data available</Typography>
        )}
      </CardContent>
    </Card>
  );
}
