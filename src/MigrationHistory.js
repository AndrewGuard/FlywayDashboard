import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress } from '@mui/material';

export default function MigrationHistory() {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetch('/api/jdbc-connections/history')
      .then(res => res.json())
      .then(data => {
        setHistory(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <CircularProgress sx={{ mt: 4 }} />;

  return (
    <Box sx={{ mt: 6 }}>
      <Typography variant="h5" gutterBottom>
        Flyway Migration History
      </Typography>
      {history.map(db => (
        <Box key={db.dbName} sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>{db.dbName}</Typography>
          {db.error ? (
            <Typography color="error">Error: {db.error}</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Version</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Installed On</TableCell>
                    <TableCell>State</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {db.history.map(row => (
                    <TableRow key={row.installed_rank}>
                      <TableCell>{row.version}</TableCell>
                      <TableCell>{row.description}</TableCell>
                      <TableCell>{row.type}</TableCell>
                      <TableCell>{row.installed_on}</TableCell>
                      <TableCell>{row.success === 1 ? 'Success' : 'Failed'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      ))}
    </Box>
  );
}
