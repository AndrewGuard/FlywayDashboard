import * as React from 'react';
import { Card, CardContent, Typography, Grid } from '@mui/material';

const metrics = [
  { label: 'Databases Deployed To', value: 12 }, // Replace 12 with real count from Flyway schema histories
  { label: 'Migrations', value: 42 },
  { label: 'Errors', value: 3 },
  { label: 'CDC Objects', value: 7 },
  { label: 'Pending', value: 5 },
];

export default function MetricsCards() {
  return (
    <Grid container spacing={2}>
      {metrics.map((metric) => (
        <Grid item xs={12} sm={6} md={3} key={metric.label}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                {metric.label}
              </Typography>
              <Typography variant="h4">{metric.value}</Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
