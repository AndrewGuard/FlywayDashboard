import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

function calculateAverageTimes(migrationsByDb) {
  // Returns [{ dbName, avgTimeSeconds, count }]
  return Object.entries(migrationsByDb).map(([dbName, migrations]) => {
    // Only consider successful deployments, exclude undo/undo_sql
    const filtered = (migrations || []).filter(m => {
      const t = m.type ? m.type.toLowerCase() : '';
      return t !== 'undo' && t !== 'undo_sql' && (!m.success || m.success === true);
    });
    // Calculate average time (in seconds) for each deployment
    // Use 'execution_time' or 'installed_on' and 'completed_on' if available
    let totalTime = 0;
    let count = 0;
    filtered.forEach(m => {
      if (typeof m.execution_time === 'number') {
        totalTime += m.execution_time;
        count++;
      } else if (m.installed_on && m.completed_on) {
        const start = new Date(m.installed_on).getTime();
        const end = new Date(m.completed_on).getTime();
        if (!isNaN(start) && !isNaN(end) && end > start) {
          totalTime += (end - start) / 1000;
          count++;
        }
      }
    });
    const avgTimeSeconds = count > 0 ? totalTime / count : 0;
    return { dbName, avgTimeSeconds, count };
  });
}

const AverageDeploymentTimeWidget = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMigrations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/flyway/history/all');
      if (!res.ok) throw new Error('Failed to fetch migration history');
      const data = await res.json();
      setRows(calculateAverageTimes(data));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMigrations();
    const interval = setInterval(fetchMigrations, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card sx={{ minWidth: 275, mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Average Deployment Time per Database
        </Typography>
        {loading ? (
          <Typography>Loading...</Typography>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Database</TableCell>
                  <TableCell align="right">Avg Time (ms)</TableCell>
                  <TableCell align="right">Deployments</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map(row => (
                  <TableRow key={row.dbName}>
                    <TableCell>{row.dbName}</TableCell>
                    <TableCell align="right">{row.avgTimeSeconds.toFixed(2)}</TableCell>
                    <TableCell align="right">{row.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default AverageDeploymentTimeWidget;
