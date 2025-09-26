import React, { useEffect, useState } from 'react';
import {
  Card, CardContent, Typography, Box,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';

/**
 * AverageDeploymentTimeWidget
 * - Loads /api/flyway/history/all
 * - Normalizes possible shapes into a flat array of migration rows
 * - Computes average deployment time per JDBC connection string (environment)
 * - Renders a simple table; always defensive against missing/invalid data
 */

const pickDuration = (m) => {
  // Try a number of possible fields (prefer ms where named)
  const candidates = [
    'execution_time_ms', 'execution_time', 'duration_ms', 'duration',
    'executionTimeMs', 'executionTime', 'durationMs', 'durationSeconds', 'execution_time_seconds'
  ];
  for (const k of candidates) {
    if (m[k] != null) {
      const n = Number(m[k]);
      if (Number.isFinite(n)) return n;
    }
  }
  return NaN;
};

export default function AverageDeploymentTimeWidget() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/flyway/history/all');
        if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
        const raw = await res.json();

        // Normalize to flat migrations array
        let migrations = [];
        if (Array.isArray(raw)) {
          // shape: per-db entries [{ dbName, history: [...] }, ...]
          if (raw.length && raw[0] && Array.isArray(raw[0].history)) {
            raw.forEach(dbEntry => {
              const connStr = dbEntry.connectionString || dbEntry.connStr || dbEntry.jdbc || dbEntry.dbName || dbEntry.db || 'unknown';
              (Array.isArray(dbEntry.history) ? dbEntry.history : []).forEach(row => {
                migrations.push({ connectionString: connStr, ...row });
              });
            });
          } else {
            // already flat
            migrations = raw;
          }
        } else if (raw && Array.isArray(raw.history)) {
          migrations = raw.history;
        } else if (raw && Array.isArray(raw.rows)) {
          migrations = raw.rows;
        } else {
          migrations = []; // safe fallback
        }

        // Group by connection string and accumulate durations
        const byConnStr = {};
        (migrations || []).forEach(m => {
          const conn = m.connectionString || m.connStr || m.jdbc || m.dbName || m.db || 'unknown';
          const duration = pickDuration(m);
          if (!Number.isFinite(duration)) return;
          byConnStr[conn] = byConnStr[conn] || { total: 0, count: 0 };
          byConnStr[conn].total += duration;
          byConnStr[conn].count += 1;
        });

        const results = Object.keys(byConnStr).map(conn => ({
          connectionString: conn,
          avgMs: byConnStr[conn].count ? (byConnStr[conn].total / byConnStr[conn].count) : null,
          count: byConnStr[conn].count
        }));

        // Sort by count desc for display
        const sorted = results.sort((a, b) => (b.count || 0) - (a.count || 0));

        if (mounted) {
          setRows(sorted);
          setError(null);
        }
      } catch (e) {
        console.error('AverageDeploymentTime load error', e);
        if (mounted) setError(e.message || 'Failed to load');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
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
                  <TableCell>JDBC Connection / Database</TableCell>
                  <TableCell align="right">Avg Time (ms)</TableCell>
                  <TableCell align="right">Deployments</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length ? rows.map(row => (
                  <TableRow key={row.connectionString}>
                    <TableCell>{row.connectionString}</TableCell>
                    <TableCell align="right">
                      {row.avgMs == null ? '-' : Number(row.avgMs).toFixed(2)}
                    </TableCell>
                    <TableCell align="right">{row.count}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={3}><Typography variant="body2">No deployment timing data available</Typography></TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
}
