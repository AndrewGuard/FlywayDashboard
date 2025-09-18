import * as React from 'react';
import { Card, CardContent, Typography, CircularProgress } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import useFlywayMigrationsOverTime from './useFlywayMigrationsOverTime';

export default function MetricsChart() {
  const { data, loading } = useFlywayMigrationsOverTime();

  return (
    <Card sx={{ height: 340 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Total Migrations Over Time
        </Typography>
        {loading ? (
          <CircularProgress sx={{ mt: 8 }} />
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="migrations" fill="#1976d2" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
