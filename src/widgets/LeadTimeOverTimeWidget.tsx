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

const LeadTimeOverTimeWidget: React.FC = () => {
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        const refreshRes = await fetch('/api/metrics/lead-time-history/refresh');
        if (!refreshRes.ok) throw new Error('Failed to refresh lead time history');
        
        const data = await refreshRes.json();
        
        if (!mounted) return;

        const dataPoints = Array.isArray(data?.dataPoints) ? data.dataPoints : [];
        
        if (!dataPoints.length) {
          setError('No lead time history data available');
          setLoading(false);
          return;
        }

        const labels = dataPoints.map(p => p.date);
        const flywayData = dataPoints.map(p => p.flywayLeadTime || 0);
        const nonFlywayData = dataPoints.map(p => p.nonFlywayLeadTime || 0);

        setChartData({
          labels,
          datasets: [
            {
              label: 'Flyway Lead Time (days)',
              data: flywayData,
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.5)',
              tension: 0.1
            },
            {
              label: 'Non-Flyway Lead Time (days)',
              data: nonFlywayData,
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgba(255, 99, 132, 0.5)',
              tension: 0.1
            }
          ]
        });

        setLoading(false);
      } catch (err) {
        console.error('Lead time history error:', err);
        if (mounted) {
          setError(err.message || 'Failed to load lead time history');
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
      title: { display: true, text: 'Lead Time for Changes Over Time' },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.parsed.y} days`
        }
      }
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Lead Time (days)' } },
      x: { title: { display: true, text: 'Date' } }
    }
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>Lead Time for Changes Over Time</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Comparing Flyway vs Non-Flyway lead times over time
        </Typography>
        {loading ? (
          <Typography>Loading lead time history...</Typography>
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

export default LeadTimeOverTimeWidget;