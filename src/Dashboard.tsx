import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import ChangeInDeploymentMetricsWidget from './widgets/ChangeInDeploymentMetricsWidget';
import AverageDeploymentTimeWidget from './widgets/AverageDeploymentTimeWidget';
import DeploymentsOverTimeWidget from './widgets/DeploymentsOverTimeWidget';
import LeadTimeOverTimeWidget from './widgets/LeadTimeOverTimeWidget';
import TopPlatformsWidget from './widgets/TopPlatformsWidget';
import TopDatabasesWidget from './widgets/TopDatabasesWidget';
import UndoMigrationsWidget from './widgets/UndoMigrationsWidget';
import MigrationHistoryWidget from './widgets/MigrationHistoryWidget';
import MetricsChart from './MetricsChart';

const Dashboard: React.FC = () => {
  return (
    <Box>
      {/* Page Header */}
      <Box id="overview" sx={{ mb: 4 }}>
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
        <Grid item xs={12} id="metrics-overview">
          <ChangeInDeploymentMetricsWidget />
        </Grid>

        {/* Lead Time Over Time - Full width chart */}
        <Grid item xs={12} id="lead-time-trend">
          <LeadTimeOverTimeWidget />
        </Grid>

        {/* Average Deployment Time - Full width */}
        <Grid item xs={12} id="avg-deployment-time">
          <AverageDeploymentTimeWidget />
        </Grid>

        {/* Metrics Chart - Full width */}
        <Grid item xs={12} id="change-failure-rate">
          <MetricsChart />
        </Grid>

        {/* Deployments Over Time - Full width */}
        <Grid item xs={12} id="deployment-frequency">
          <DeploymentsOverTimeWidget />
        </Grid>

        {/* Top Platforms - Full width */}
        <Grid item xs={12} id="top-platforms">
          <TopPlatformsWidget />
        </Grid>

        {/* Top Databases - Full width */}
        <Grid item xs={12} id="top-databases">
          <TopDatabasesWidget />
        </Grid>

        {/* Undo Migrations - Full width */}
        <Grid item xs={12} id="undo-migrations">
          <UndoMigrationsWidget />
        </Grid>

        {/* Migration History - Full width */}
        <Grid item xs={12}>
          <MigrationHistoryWidget />
        </Grid>

      </Grid>
    </Box>
  );
};

export default Dashboard;
