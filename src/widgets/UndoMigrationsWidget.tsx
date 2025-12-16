import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box, List, ListItem, ListItemText } from '@mui/material';

interface Migration {
  version?: string;
  type?: string;
  description?: string;
  script?: string;
  installed_on?: string;
  database?: string;
}

const UndoMigrationsWidget: React.FC = () => {
  const [undoMigrations, setUndoMigrations] = useState<Migration[]>([]);
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

        const migrations = Array.isArray(data) ? data : [];
        
        // Filter for undo migrations (version starts with U)
        const undos = migrations.filter(m => {
          const version = m.version || '';
          return version.startsWith('U') || m.type === 'UNDO';
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

    fetchData();
    return () => { mounted = false; };
  }, []);

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>Undo Migrations</Typography>
        {loading ? (
          <Typography>Loading...</Typography>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : undoMigrations.length > 0 ? (
          <List dense>
            {undoMigrations.slice(0, 10).map((m, i) => (
              <ListItem key={i}>
                <ListItemText
                  primary={m.description || m.script || `Undo ${m.version}`}
                  secondary={`Version: ${m.version} | ${new Date(m.installed_on).toLocaleDateString()}`}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography color="text.secondary">No undo migrations found</Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default UndoMigrationsWidget;
