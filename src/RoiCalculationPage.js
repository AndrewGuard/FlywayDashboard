import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

export default function RoiCalculationPage() {
  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          How is ROI Calculated?
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          ROI (Return on Investment) is calculated as the net value of improvements from using Flyway divided by the total cost of deployments with Flyway.
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          <b>Value includes:</b>
          <ul>
            <li>Reduction in lead time per deployment (faster delivery)</li>
            <li>Increase in deployments per year (higher throughput)</li>
            <li>Reduction in script failure rate (fewer failed deployments)</li>
          </ul>
          Each is multiplied by the number of people involved, their average salary, and the number of deployments per year. Cost is the total salary cost for all deployments with Flyway.
        </Typography>
        <Typography variant="body2">
          <b>Formula:</b><br/>
          ROI = (Value - Cost) / Cost<br/>
          Where Value = (Lead Time Savings + Deployment Increase Value + Failure Rate Savings)
        </Typography>
      </Paper>
    </Box>
  );
}
