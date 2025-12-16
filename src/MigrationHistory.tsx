import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material';

interface Migration {
  version?: string;
  description?: string;
  type?: string;
  script?: string;
  checksum?: number;
  installed_by?: string;
  installed_on?: string;
  execution_time?: number;
  success?: boolean | number | string;
  database?: string;
}

const MigrationHistory: React.FC = () => {
  const [migrations, setMigrations] = useState<Migration[]>([]);
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

        const migrationList = Array.isArray(data) ? data : [];
        setMigrations(migrationList);
        setLoading(false);
      } catch (err) {
        console.error('Migration history error:', err);
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
        <Typography variant="h6" gutterBottom>Migration History</Typography>
        {loading ? (
          <Typography>Loading...</Typography>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : migrations.length > 0 ? (
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Version</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Installed On</TableCell>
                  <TableCell>Execution Time</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {migrations.slice(0, 50).map((m, i) => (
                  <TableRow key={i}>
                    <TableCell>{m.version || '-'}</TableCell>
                    <TableCell>{m.description || m.script || '-'}</TableCell>
                    <TableCell>{m.type || '-'}</TableCell>
                    <TableCell>{m.installed_on ? new Date(m.installed_on).toLocaleString() : '-'}</TableCell>
                    <TableCell>{m.execution_time ? `${m.execution_time}ms` : '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={m.success === true || m.success === 't' ? 'Success' : 'Failed'}
                        color={m.success === true || m.success === 't' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography color="text.secondary">No migrations found</Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default MigrationHistory;
