import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box, LinearProgress } from '@mui/material';

export default function DeploymentSuccessRate() {
  const [stats, setStats] = useState(null);
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
          setError('No data');
          setLoading(false);
          return;
        }

        const total = migrations.length;
        const successful = migrations.filter(m => m.success === true || m.success === 't').length;
        const failed = total - successful;
        const successRate = total > 0 ? (successful / total) * 100 : 0;

        setStats({ total, successful, failed, successRate: Math.round(successRate * 10) / 10 });
        setLoading(false);
      } catch (err) {
        console.error('Deployment success rate error:', err);
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
        <Typography variant="h6" gutterBottom>Deployment Success Rate</Typography>
        {loading ? (
          <Typography>Loading...</Typography>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : stats ? (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Success Rate</Typography>
              <Typography variant="body2" fontWeight="bold">{stats.successRate}%</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={stats.successRate}
              color={stats.successRate >= 90 ? 'success' : stats.successRate >= 70 ? 'warning' : 'error'}
              sx={{ height: 10, borderRadius: 5, mb: 2 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" color="success.main">{stats.successful}</Typography>
                <Typography variant="caption">Successful</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" color="error.main">{stats.failed}</Typography>
                <Typography variant="caption">Failed</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5">{stats.total}</Typography>
                <Typography variant="caption">Total</Typography>
              </Box>
            </Box>
          </Box>
        ) : (
          <Typography>No data available</Typography>
        )}
      </CardContent>
    </Card>
  );
}
