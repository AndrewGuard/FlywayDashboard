import * as React from 'react';
import { Card, CardContent, Typography, Grid, CircularProgress } from '@mui/material';
import useMigrationDeployments from './useMigrationDeployments';

export default function MetricsCards() {
  const { deployments, loading } = useMigrationDeployments();

  if (loading) return <CircularProgress sx={{ mt: 2 }} />;

  return (
    <Grid container spacing={2}>
      {deployments.map((env) => (
        <Grid item xs={12} sm={6} md={3} key={env.dbName}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                {env.dbName}
              </Typography>
              {env.error ? (
                <Typography color="error">Error: {env.error}</Typography>
              ) : (
                <Typography variant="h4">{env.count}</Typography>
              )}
              <Typography variant="caption">Deployments</Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
