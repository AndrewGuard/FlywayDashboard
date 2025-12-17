import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';

interface DataPoint {
  date: string;
  flywayLeadTime: number | null;
  nonFlywayLeadTime: number | null;
}

const LeadTimeOverTimeWidget: React.FC = () => {
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
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

        const points = Array.isArray(data?.dataPoints) ? data.dataPoints : [];
        
        if (!points.length) {
          setError('No lead time history data available');
          setLoading(false);
          return;
        }

        setDataPoints(points);
        setLoading(false);
      } catch (err: any) {
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

  if (loading) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Lead Time for Changes Over Time</Typography>
          <Typography>Loading lead time history...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Lead Time for Changes Over Time</Typography>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  if (!dataPoints.length) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Lead Time for Changes Over Time</Typography>
          <Typography>No data available</Typography>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for MUI X-Charts
  const xAxisData = dataPoints.map(p => new Date(p.date));
  const flywayData = dataPoints.map(p => p.flywayLeadTime ?? null);
  const nonFlywayData = dataPoints.map(p => p.nonFlywayLeadTime ?? null);

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>Lead Time for Changes Over Time</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Comparing Flyway vs Non-Flyway lead times over time
        </Typography>
        <Box sx={{ height: 400, mt: 2 }}>
          <LineChart
            xAxis={[{ 
              data: xAxisData, 
              scaleType: 'time',
              label: 'Date'
            }]}
            yAxis={[{ 
              label: 'Lead Time (days)',
              min: 0
            }]}
            series={[
              {
                data: flywayData,
                label: 'Flyway',
                color: '#4caf50',
                showMark: true,
                curve: 'linear'
              },
              {
                data: nonFlywayData,
                label: 'Non-Flyway',
                color: '#f44336',
                showMark: true,
                curve: 'linear'
              }
            ]}
            height={350}
            margin={{ top: 20, right: 20, bottom: 60, left: 60 }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default LeadTimeOverTimeWidget;