import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Grid, Box } from '@mui/material';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const TopPlatformsWidgets: React.FC = () => {
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

        // Count by database type/platform
        const platforms = {};
        migrations.forEach(m => {
          const platform = m.database || m.type || 'Unknown';
          platforms[platform] = (platforms[platform] || 0) + 1;
        });

        const labels = Object.keys(platforms);
        const values = Object.values(platforms);
        
        const colors = [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)'
        ];

        setChartData({
          labels,
          datasets: [{
            data: values,
            backgroundColor: colors.slice(0, labels.length),
            borderWidth: 1
          }]
        });

        setLoading(false);
      } catch (err) {
        console.error('Top platforms error:', err);
        if (mounted) {
          setError(err.message || 'Failed to load data');
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => { mounted = false; };
  }, []);

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>Top Platforms</Typography>
        {loading ? (
          <Typography>Loading...</Typography>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : chartData ? (
          <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
            <Pie data={chartData} options={{ maintainAspectRatio: false }} />
          </Box>
        ) : (
          <Typography>No data available</Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default TopPlatformsWidgets;
