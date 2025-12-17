import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import ChangeInDeploymentMetricsWidget from './widgets/ChangeInDeploymentMetricsWidget';
import LeadTimeComparisonWidget from './widgets/LeadTimeComparisonWidget';
import LeadTimeOverTimeWidget from './widgets/LeadTimeOverTimeWidget';
import TopPlatformsWidgets from './widgets/TopPlatformsWidgets';
import UndoMigrationsWidget from './widgets/UndoMigrationsWidget';

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
        {/* Lead Time Comparison - Full width for prominence */}
        <Grid item xs={12}>
          <LeadTimeComparisonWidget />
        </Grid>

        {/* Change in Deployment Metrics - Prominent secondary position */}
        <Grid item xs={12} lg={8}>
          <ChangeInDeploymentMetricsWidget />
        </Grid>

        {/* Top Platforms - Side column */}
        <Grid item xs={12} lg={4}>
          <TopPlatformsWidgets />
        </Grid>

        {/* Lead Time Over Time - Full width chart */}
        <Grid item xs={12}>
          <LeadTimeOverTimeWidget />
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