import * as React from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', migrations: 10 },
  { name: 'Feb', migrations: 15 },
  { name: 'Mar', migrations: 8 },
  { name: 'Apr', migrations: 20 },
  { name: 'May', migrations: 12 },
];

export default function MetricsChart() {
  return (
    <Card sx={{ height: 340 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Migrations Over Time
        </Typography>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="migrations" fill="#1976d2" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
