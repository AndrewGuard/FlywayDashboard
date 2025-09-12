import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, CircularProgress } from '@mui/material';

export default function JdbcConnectionsList() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/jdbc-connections')
      .then(res => res.json())
      .then(data => {
        setConnections(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <CircularProgress sx={{ mt: 4 }} />;

  return (
    <Box sx={{ mt: 6 }}>
      <Typography variant="h5" gutterBottom>
        JDBC Connections
      </Typography>
      <Paper>
        <List>
          {connections.map((conn, idx) => (
            <ListItem key={idx} divider>
              <ListItemText primary={conn} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
}
