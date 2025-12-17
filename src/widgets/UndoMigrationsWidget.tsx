import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box, List, ListItem, ListItemText, Collapse, IconButton, LinearProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface Migration {
  version?: string;
  type?: string;
  description?: string;
  script?: string;
  installed_on?: string;
  database?: string;
}

const UndoMigrationsWidget: React.FC = () => {
  const theme = useTheme();
  const [undoMigrations, setUndoMigrations] = useState<Migration[]>([]);
  const [totalMigrations, setTotalMigrations] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    let pollInterval: NodeJS.Timeout;

    async function fetchData() {
      try {
        const res = await fetch('/api/flyway/history/all');
        if (!res.ok) throw new Error('Failed to fetch migration history');
        
        const data = await res.json();
        
        if (!mounted) return;

        const migrations = Array.isArray(data) ? data : [];
        setTotalMigrations(migrations.length);
        
        // Filter for undo migrations (type is UNDO_SQL or version starts with U)
        const undos = migrations.filter(m => {
          const version = m.version || '';
          const type = m.type || '';
          return type === 'UNDO_SQL' || version.startsWith('U') || m.type === 'UNDO';
        });

        setUndoMigrations(undos);
        setLoading(false);
      } catch (err) {
        console.error('Undo migrations error:', err);
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
const undoPercentage = totalMigrations > 0 ? (undoMigrations.length / totalMigrations) * 100 : 0;
  const regularMigrations = totalMigrations - undoMigrations.length;

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">Undo Migrations</Typography>
            {!loading && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {undoMigrations.length} undo migration{undoMigrations.length !== 1 ? 's' : ''} out of {totalMigrations} total ({undoPercentage.toFixed(1)}%)
              </Typography>
            )}
            
            {!loading && totalMigrations > 0 && (
              <Box sx={{ width: '100%', mb: 1 }}>
                {/* Visual bar showing undo vs regular migrations */}
                <Box sx={{ display: 'flex', height: 24, borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                  {/* Regular migrations (green) */}
                  <Box
                    sx={{
                      width: `${((regularMigrations / totalMigrations) * 100)}%`,
                      bgcolor: theme.palette.success.main,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'width 0.3s ease'
                    }}
                  >
                    {regularMigrations > 0 && (
                      <Typography variant="caption" sx={{ color: 'white', fontWeight: 600, fontSize: '0.7rem' }}>
                        {regularMigrations}
                      </Typography>
                    )}
                  </Box>
                  {/* Undo migrations (red) */}
                  <Box
                    sx={{
                      width: `${undoPercentage}%`,
                      bgcolor: theme.palette.error.main,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'width 0.3s ease'
                    }}
                  >
                    {undoMigrations.length > 0 && (
                      <Typography variant="caption" sx={{ color: 'white', fontWeight: 600, fontSize: '0.7rem' }}>
                        {undoMigrations.length}
                      </Typography>
                    )}
                  </Box>
                </Box>
                {/* Legend */}
                <Box sx={{ display: 'flex', gap: 2, mt: 1, justifyContent: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 12, height: 12, bgcolor: theme.palette.success.main, borderRadius: 0.5 }} />
                    <Typography variant="caption" color="text.secondary">Regular Migrations</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 12, height: 12, bgcolor: theme.palette.error.main, borderRadius: 0.5 }} />
                    <Typography variant="caption" color="text.secondary">Undo Migrations</Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
          {!loading && undoMigrations.length > 0 && (
            <IconButton
              onClick={() => setExpanded(!expanded)}
              sx={{
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s',
                ml: 2
              }}
            >
              <ExpandMoreIcon />
            </IconButton>
          )}
        </Box>

        {loading ? (
          <Typography sx={{ mt: 2 }}>Loading...</Typography>
        ) : error ? (
          <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>
        ) : undoMigrations.length > 0 ? (
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <List dense sx={{ mt: 1 }}>
              {undoMigrations.slice(0, 10).map((m, i) => (
                <ListItem key={i}>
                  <ListItemText
                    primary={m.description || m.script || `Undo ${m.version}`}
                    secondary={`Version: ${m.version} | ${new Date(m.installed_on).toLocaleDateString()}`}
                  />
                </ListItem>
              ))}
            </List>
          </Collapse>
        ) : (
          <Typography color="text.secondary" sx={{ mt: 2 }}>No undo migrations found</Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default UndoMigrationsWidget;
