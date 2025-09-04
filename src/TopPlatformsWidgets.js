import * as React from 'react';
import { Card, CardContent, Typography, Grid, Box } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Sample data: Replace with real Flyway schema history data fetch
const topPlatforms = [
  { platform: 'SQL Server', deployments: 120, history: [10, 20, 30, 25, 35] },
  { platform: 'PostgreSQL', deployments: 95, history: [15, 18, 22, 20, 20] },
  { platform: 'Oracle', deployments: 80, history: [12, 15, 18, 17, 18] },
  { platform: 'MySQL', deployments: 60, history: [8, 12, 15, 13, 12] },
  { platform: 'SQLite', deployments: 40, history: [5, 8, 10, 9, 8] },
];

const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug'];

export default function TopPlatformsWidgets() {
  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      {topPlatforms.map((platform) => (
        <Grid item xs={12} sm={6} md={2.4} key={platform.platform}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                {platform.platform}
              </Typography>
              <Typography variant="h5" color="primary.main" gutterBottom>
                {platform.deployments} Deployments
              </Typography>
              <Box sx={{ height: 80 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={platform.history.map((v, i) => ({ month: months[i], deployments: v }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" fontSize={10} />
                    <YAxis hide />
                    <Tooltip />
                    <Bar dataKey="deployments" fill="#d7263d" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
