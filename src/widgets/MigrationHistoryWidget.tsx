import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';

interface Migration {
  version?: string;
  description?: string;
  type?: string;
  script?: string;
  installed_by?: string;
  installed_on?: string;
  execution_time?: number;
  success?: boolean | number | string;
  database?: string;
  dbType?: string;
}

const MigrationHistoryWidget: React.FC = () => {
  const navigate = useNavigate();
  const [migrations, setMigrations] = useState<Migration[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let pollInterval: NodeJS.Timeout;

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

    // Initial fetch
    fetchData();

    // Poll every 30 seconds for new migrations
    pollInterval = setInterval(() => {
      if (mounted) {
        fetchData();
      }
    }, 30000);

    return () => {
      mounted = false;
      clearInterval(pollInterval);
    };
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  const getSuccessChip = (success: boolean | number | string) => {
    const isSuccess = success === true || success === 1 || success === '1' || success === 'true';
    return (
      <Chip
        label={isSuccess ? 'Success' : 'Failed'}
        color={isSuccess ? 'success' : 'error'}
        size="small"
      />
    );
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Recent Migrations</Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<VisibilityIcon />}
            onClick={() => navigate('/migrations')}
          >
            View All
          </Button>
        </Box>

        {loading ? (
          <Typography color="text.secondary">Loading...</Typography>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : migrations.length > 0 ? (
          <TableContainer sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Version</strong></TableCell>
                  <TableCell><strong>Description</strong></TableCell>
                  <TableCell><strong>Type</strong></TableCell>
                  <TableCell><strong>Database</strong></TableCell>
                  <TableCell><strong>Platform</strong></TableCell>
                  <TableCell><strong>Installed</strong></TableCell>
                  <TableCell><strong>Time (ms)</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {migrations.slice(0, 10).map((m, i) => (
                  <TableRow key={i} hover>
                    <TableCell>{m.version || 'N/A'}</TableCell>
                    <TableCell>{m.description || m.script || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip label={m.type || 'SQL'} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{m.database || 'N/A'}</TableCell>
                    <TableCell>{m.dbType || 'N/A'}</TableCell>
                    <TableCell>{m.installed_on ? formatDate(m.installed_on) : 'N/A'}</TableCell>
                    <TableCell>{m.execution_time || 0}</TableCell>
                    <TableCell>{getSuccessChip(m.success)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography color="text.secondary">No migration data available</Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default MigrationHistoryWidget;
