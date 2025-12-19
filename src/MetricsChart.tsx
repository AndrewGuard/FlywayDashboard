import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, Typography, Box, IconButton, Tooltip as MuiTooltip } from '@mui/material';
import { Line } from 'react-chartjs-2';
import DownloadIcon from '@mui/icons-material/Download';
import { exportAsImage } from './utils/exportUtils';
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

interface Migration {
  installed_on?: string;
  installedOn?: string;
}

interface LineChartDataset {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
  tension: number;
}

interface LineChartData {
  labels: string[];
  datasets: LineChartDataset[];
}

const MetricsChart: React.FC = () => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [chartData, setChartData] = useState<LineChartData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      await exportAsImage(cardRef.current, 'migrations-per-month');
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

        // Group by month
        const byMonth = {};
        migrations.forEach(m => {
          const dateStr = m.installed_on || m.installedOn;
          if (!dateStr) return;
          const month = new Date(dateStr).toISOString().slice(0, 7);
          byMonth[month] = (byMonth[month] || 0) + 1;
        });

        const labels = Object.keys(byMonth).sort();
        const values = labels.map(m => byMonth[m]);

        setChartData({
          labels,
          datasets: [{
            label: 'Migrations per Month',
            data: values,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            tension: 0.1
          }]
        });

        setLoading(false);
      } catch (err) {
        console.error('Metrics chart error:', err);
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
      title: { display: true, text: 'Migration Activity Over Time' }
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Migrations' } },
      x: { title: { display: true, text: 'Month' } }
    }
  };

  return (
    <Card ref={cardRef} sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">Migration Activity</Typography>
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
          <Box sx={{ height: 300 }}><Line data={chartData} options={options} /></Box>
        ) : (
          <Typography>No data available</Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricsChart;
