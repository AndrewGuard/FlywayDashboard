import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, Typography, Box, IconButton, Tooltip as MuiTooltip } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import DownloadIcon from '@mui/icons-material/Download';
import { exportAsImage } from '../utils/exportUtils';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface BarChartDataset {
  label: string;
  data: number[];
  backgroundColor: string;
  borderColor?: string;
  borderWidth?: number;
}

interface BarChartData {
  labels: string[];
  datasets: BarChartDataset[];
}

const AverageDeploymentTimeWidget: React.FC = () => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [chartData, setChartData] = useState<BarChartData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      await exportAsImage(cardRef.current, 'average-deployment-time');
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

        // Group by database and calculate average execution time
        const dbTimes = {};
        migrations.forEach(m => {
          const db = m.database || m.schema || 'default';
          const execTime = Number(m.execution_time) || 0;
          if (!dbTimes[db]) {
            dbTimes[db] = { total: 0, count: 0 };
          }
          dbTimes[db].total += execTime;
          dbTimes[db].count += 1;
        });

        const labels = Object.keys(dbTimes);
        const avgTimes = labels.map(db => 
          dbTimes[db].count > 0 ? Math.round(dbTimes[db].total / dbTimes[db].count) : 0
        );

        setChartData({
          labels,
          datasets: [{
            label: 'Average Deployment Time (ms)',
            data: avgTimes,
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        });

        setLoading(false);
      } catch (err) {
        console.error('Average deployment time error:', err);
        if (mounted) {
          setError(err.message || 'Failed to load data');
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => { mounted = false; };
  }, []);

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Average Deployment Time per Database' }
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Time (ms)' } }
    }
  };

  return (
    <Card ref={cardRef} sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">Average Deployment Time per Database</Typography>
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
          <Box sx={{ height: 300 }}><Bar data={chartData} options={options} /></Box>
        ) : (
          <Typography>No data available</Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default AverageDeploymentTimeWidget;
