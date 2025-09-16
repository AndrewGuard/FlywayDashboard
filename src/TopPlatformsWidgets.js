import * as React from 'react';
import { Card, CardContent, Typography, Grid, Box, CircularProgress } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import useTopPlatformsFromFlyway from './useTopPlatformsFromFlyway';

export default function TopPlatformsWidgets() {
  const { platforms, loading } = useTopPlatformsFromFlyway();

  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      {loading ? (
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 120 }}>
            <CircularProgress />
          </Box>
        </Grid>
      ) : (
        platforms.map((platform) => (
          <Grid item xs={12} sm={6} md={2.4} key={platform.platform}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  {platform.platform}
                </Typography>
                {/* <Typography variant="caption" color="text.secondary" gutterBottom>
                  {platform.connStr || ''}
                </Typography> */}
                <Typography variant="h5" color="primary.main" gutterBottom>
                  {platform.deployments} Deployments
                </Typography>
                <Box sx={{ height: 80 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={platform.history}>
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
        ))
      )}
    </Grid>
  );
}
