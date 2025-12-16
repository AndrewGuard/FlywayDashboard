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

interface LineChartDataset {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
  fill?: boolean;
  tension: number;
}

interface LineChartData {
  labels: string[];
  datasets: LineChartDataset[];
}

const DeploymentsOverTimeWidget: React.FC = () => {
  const [chartData, setChartData] = useState<LineChartData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

        // Group migrations by date and database
        const byDateAndDb = {};
        migrations.forEach(m => {
          const dateStr = m.installed_on || m.installedOn;
          if (!dateStr) return;
          const date = new Date(dateStr).toISOString().slice(0, 10);
          const db = m.database || m.schema || 'default';
          
          if (!byDateAndDb[date]) byDateAndDb[date] = {};
          if (!byDateAndDb[date][db]) byDateAndDb[date][db] = 0;
          byDateAndDb[date][db]++;
        });

        const dates = Object.keys(byDateAndDb).sort();
        const databases = Array.from(new Set(migrations.map(m => m.database || m.schema || 'default')));
        
        const colors = [
          'rgb(75, 192, 192)',
          'rgb(255, 99, 132)',
          'rgb(54, 162, 235)',
          'rgb(255, 206, 86)',
          'rgb(153, 102, 255)'
        ];

        const datasets = databases.map((db, i) => ({
          label: db,
          data: dates.map(d => byDateAndDb[d]?.[db] || 0),
          borderColor: colors[i % colors.length],
          backgroundColor: colors[i % colors.length].replace('rgb', 'rgba').replace(')', ', 0.5)'),
          tension: 0.1
        }));

        setChartData({ labels: dates, datasets });
        setLoading(false);
      } catch (err) {
        console.error('Deployments over time error:', err);
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
      title: { display: true, text: 'Deployments Over Time by Database' }
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Deployments' } },
      x: { title: { display: true, text: 'Date' } }
    }
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>Deployments Over Time by Database</Typography>
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
};

export default DeploymentsOverTimeWidget;
