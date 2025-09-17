import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, CircularProgress, Box, LinearProgress } from '@mui/material';

export default function DeploymentSuccessRate() {
  const [successRate, setSuccessRate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let intervalId;
    const fetchData = () => {
      fetch('/api/jdbc-connections/history')
        .then(res => res.json())
        .then(historyArr => {
          let total = 0;
          let success = 0;
          (Array.isArray(historyArr) ? historyArr : []).forEach(db => {
            (Array.isArray(db.history) ? db.history : []).forEach(row => {
              total++;
              if (row.success === true || row.success === 1) success++;
            });
          });
          setSuccessRate(total > 0 ? (success / total) * 100 : null);
          setLoading(false);
        })
        .catch(() => {
          setSuccessRate(null);
          setLoading(false);
        });
    };
    fetchData();
    intervalId = setInterval(fetchData, 60000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Deployment Success Rate
        </Typography>
        {loading ? (
          <CircularProgress />
        ) : successRate !== null ? (
          <Box>
            <Typography variant="h4" color={successRate >= 99 ? 'success.main' : successRate >= 90 ? 'warning.main' : 'error.main'}>
              {successRate.toFixed(1)}%
            </Typography>
            <LinearProgress variant="determinate" value={successRate} sx={{ height: 10, borderRadius: 5, mt: 1 }} />
          </Box>
        ) : (
          <Typography color="text.secondary">No data</Typography>
        )}
      </CardContent>
    </Card>
  );
}
