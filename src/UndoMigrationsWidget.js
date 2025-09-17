import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, LinearProgress, Box } from '@mui/material';

function calculateUndoStats(migrations) {
  if (!Array.isArray(migrations) || migrations.length === 0) {
    return { total: 0, undoCount: 0, percent: 0 };
  }
  const undoCount = migrations.filter(m =>
    m.type && m.type.toLowerCase() === 'undo'
  ).length;
  const percent = ((undoCount / migrations.length) * 100).toFixed(1);
  return { total: migrations.length, undoCount, percent };
}

const UndoMigrationsWidget = () => {
  const [stats, setStats] = useState({ total: 0, undoCount: 0, percent: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMigrations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/flyway/history/all');
      if (!res.ok) throw new Error('Failed to fetch migration history');
      const data = await res.json();
      // Flatten all migrations from all DBs
      const allMigrations = Object.values(data)
        .flat()
        .filter(Boolean);
      setStats(calculateUndoStats(allMigrations));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMigrations();
    const interval = setInterval(fetchMigrations, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, []);

  return (
    <Card sx={{ minWidth: 275, mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Undo Migrations
        </Typography>
        {loading ? (
          <LinearProgress />
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <Box>
            <Typography variant="h4" color="primary.main">
              {stats.undoCount} / {stats.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {stats.percent}% of all migrations are UNDO
            </Typography>
            <LinearProgress
              variant="determinate"
              value={Number(stats.percent)}
              sx={{ mt: 1, height: 8, borderRadius: 4 }}
              color={stats.percent > 0 ? 'warning' : 'success'}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default UndoMigrationsWidget;
