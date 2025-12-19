import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, Typography, Grid, Box, IconButton, Tooltip as MuiTooltip } from '@mui/material';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import DownloadIcon from '@mui/icons-material/Download';
import { exportAsImage } from '../utils/exportUtils';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ChartDataset {
  label?: string;
  data: number[];
  backgroundColor: string[];
  borderWidth?: number;
}

interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

const TopDatabasesWidget: React.FC = () => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      await exportAsImage(cardRef.current, 'top-databases');
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        const res = await fetch('/api/flyway/history/all');
        if (!res.ok) throw new Error('Failed to fetch migration history');
        
        const data = await res.json();
        
        if (!mounted) return;

        const migrations = Array.isArray(data) ? data : [];
        
        if (!migrations.length) {
          setError('No migration data available');
          setLoading(false);
          return;
        }

        // Count by database name
        const databases = {};
        migrations.forEach(m => {
          const dbName = m.database || m.type || 'Unknown';
          databases[dbName] = (databases[dbName] || 0) + 1;
        });

        const labels = Object.keys(databases);
        const values = Object.values(databases) as number[];
        
        const colors = [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)'
        ];

        setChartData({
          labels,
          datasets: [{
            data: values,
            backgroundColor: colors.slice(0, labels.length),
            borderWidth: 1
          }]
        });

        setLoading(false);
      } catch (err) {
        console.error('Top databases error:', err);
        if (mounted) {
          setError(err.message || 'Failed to load data');
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => { mounted = false; };
  }, []);

  return (
    <Card ref={cardRef} sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">Top Databases</Typography>
          <MuiTooltip title="Download as image">
            <IconButton onClick={handleExport} disabled={exporting} size="small">
              <DownloadIcon />
            </IconButton>
          </MuiTooltip>
        </Box>
        {loading ? (
          <Typography>Loading...</Typography>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : chartData ? (
          <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
            <Pie data={chartData} options={{ maintainAspectRatio: false }} />
          </Box>
        ) : (
          <Typography>No data available</Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default TopDatabasesWidget;
