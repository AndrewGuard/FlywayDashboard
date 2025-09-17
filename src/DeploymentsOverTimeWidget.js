import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function groupDeploymentsByDateAndDb(migrations) {
  // { dbName: { date: count } }
  const result = {};
  migrations.forEach(({ dbName, installed_on }) => {
    if (!dbName || !installed_on) return;
    const date = new Date(installed_on).toISOString().slice(0, 10); // YYYY-MM-DD
    if (!result[dbName]) result[dbName] = {};
    if (!result[dbName][date]) result[dbName][date] = 0;
    result[dbName][date]++;
  });
  return result;
}

const DeploymentsOverTimeWidget = () => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMigrations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/flyway/history/all');
      if (!res.ok) throw new Error('Failed to fetch migration history');
      const data = await res.json();
      // Flatten and annotate with dbName
      const allMigrations = Object.entries(data)
        .flatMap(([dbName, arr]) => (arr || []).map(m => ({ ...m, dbName })));
      // Only count successful deployments (exclude UNDO, UNDO_SQL, failed)
      const filtered = allMigrations.filter(m => {
        const t = m.type ? m.type.toLowerCase() : '';
        return t !== 'undo' && t !== 'undo_sql' && (!m.success || m.success === true);
      });
      const grouped = groupDeploymentsByDateAndDb(filtered);
      // Get all unique dates
      const allDates = Array.from(new Set(
        Object.values(grouped).flatMap(db => Object.keys(db))
      )).sort();
      // Prepare datasets for each db
      const datasets = Object.entries(grouped).map(([dbName, dateCounts], idx) => ({
        label: dbName,
        data: allDates.map(date => dateCounts[date] || 0),
        borderColor: `hsl(${(idx * 60) % 360}, 70%, 50%)`,
        backgroundColor: `hsl(${(idx * 60) % 360}, 70%, 80%)`,
        tension: 0.2,
        fill: false
      }));
      setChartData({
        labels: allDates,
        datasets
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMigrations();
    const interval = setInterval(fetchMigrations, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card sx={{ minWidth: 275, mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Deployments Over Time by Database
        </Typography>
        {loading ? (
          <Typography>Loading...</Typography>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : chartData ? (
          <Box sx={{ height: 300 }}>
            <Line
              data={chartData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'top' },
                  title: { display: false }
                },
                scales: {
                  x: { title: { display: true, text: 'Date' } },
                  y: { title: { display: true, text: 'Deployments' }, beginAtZero: true }
                }
              }}
            />
          </Box>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default DeploymentsOverTimeWidget;
