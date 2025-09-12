import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Button } from '@mui/material';

export default function MigrationHistory() {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = () => {
    setLoading(true);
    fetch('/api/jdbc-connections/history')
      .then(res => res.json())
      .then(data => {
        setHistory(Array.isArray(data) ? data : []);
        setLoading(false);
        setRefreshing(false);
      })
      .catch(() => {
        setHistory([]);
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line
  }, []);

  if (loading) return <CircularProgress sx={{ mt: 4 }} />;

  return (
    <Box sx={{ mt: 6 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" gutterBottom sx={{ flexGrow: 1 }}>
          Flyway Migration History
        </Typography>
        <Button variant="contained" onClick={() => { setRefreshing(true); fetchHistory(); }} disabled={refreshing} size="small">
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>
      {history.map((db, i) => (
        <Box key={db.dbName || i} sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>{db.dbName || 'Unknown DB'}</Typography>
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
                  {(Array.isArray(db.history) ? db.history : []).map(row => (
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
