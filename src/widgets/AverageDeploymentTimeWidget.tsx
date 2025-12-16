import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AverageDeploymentTimeWidget: React.FC = () => {
  const [chartData, setChartData] = useState<any>(null);
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

        // Group by database and calculate average execution time
        const dbTimes = {};
        migrations.forEach(m => {
          const db = m.database || m.schema || 'default';
          const execTime = Number(m.execution_time) || 0;
          if (!dbTimes[db]) {
            dbTimes[db] = { total: 0, count: 0 };
          }
          dbTimes[db].total += execTime;
          dbTimes[db].count += 1;
        });

        const labels = Object.keys(dbTimes);
        const avgTimes = labels.map(db => 
          dbTimes[db].count > 0 ? Math.round(dbTimes[db].total / dbTimes[db].count) : 0
        );

        setChartData({
          labels,
          datasets: [{
            label: 'Average Deployment Time (ms)',
            data: avgTimes,
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        });

        setLoading(false);
      } catch (err) {
        console.error('Average deployment time error:', err);
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
      title: { display: true, text: 'Average Deployment Time per Database' }
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Time (ms)' } }
    }
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>Average Deployment Time per Database</Typography>
        {loading ? (
          <Typography>Loading...</Typography>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : chartData ? (
          <Box sx={{ height: 300 }}><Bar data={chartData} options={options} /></Box>
        ) : (
          <Typography>No data available</Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default AverageDeploymentTimeWidget;
