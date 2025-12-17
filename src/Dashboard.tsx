import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import ChangeInDeploymentMetricsWidget from './widgets/ChangeInDeploymentMetricsWidget';
import AverageDeploymentTimeWidget from './widgets/AverageDeploymentTimeWidget';
import DeploymentsOverTimeWidget from './widgets/DeploymentsOverTimeWidget';
import LeadTimeOverTimeWidget from './widgets/LeadTimeOverTimeWidget';
import TopPlatformsWidget from './widgets/TopPlatformsWidget';
import TopDatabasesWidget from './widgets/TopDatabasesWidget';
import UndoMigrationsWidget from './widgets/UndoMigrationsWidget';
import MetricsChart from './MetricsChart';

const Dashboard: React.FC = () => {
  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
          Flyway Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your database migration metrics and ROI
        </Typography>
      </Box>

      {/* Dashboard Grid */}
      <Grid container spacing={3}>
        {/* Change in Deployment Metrics - Full width for prominence */}
        <Grid item xs={12}>
          <ChangeInDeploymentMetricsWidget />
        </Grid>

        {/* Lead Time Over Time - Full width chart */}
        <Grid item xs={12}>
          <LeadTimeOverTimeWidget />
        </Grid>

        {/* Average Deployment Time - Full width */}
        <Grid item xs={12}>
          <AverageDeploymentTimeWidget />
        </Grid>

        {/* Metrics Chart - Full width */}
        <Grid item xs={12}>
          <MetricsChart />
        </Grid>

        {/* Deployments Over Time - Full width */}
        <Grid item xs={12}>
          <DeploymentsOverTimeWidget />
        </Grid>

        {/* Top Platforms - Full width */}
        <Grid item xs={12}>
          <TopPlatformsWidget />
        </Grid>

        {/* Top Databases - Full width */}
        <Grid item xs={12}>
          <TopDatabasesWidget />
        </Grid>

        {/* Undo Migrations - Full width */}
        <Grid item xs={12}>
          <UndoMigrationsWidget />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
