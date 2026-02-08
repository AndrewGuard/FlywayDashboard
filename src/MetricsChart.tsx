import React from 'react';
import { Box } from '@mui/material';
import { Line } from 'react-chartjs-2';
import { WidgetWrapper } from './components/WidgetWrapper';
import { useMigrationHistory } from './hooks/useFlywayData';
import { processMigrationsPerMonth } from './utils/chartDataProcessing';
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

const MetricsChart: React.FC = () => {
  const { data: migrations, loading, error } = useMigrationHistory();

  const chartData = migrations ? processMigrationsPerMonth(migrations) : null;

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
    <WidgetWrapper 
      title="Migration Activity" 
      loading={loading} 
      error={error}
      exportFilename="migrations-per-month"
    >
      {chartData ? (
        <Box sx={{ height: 300 }}>
          <Line data={chartData} options={options} />
        </Box>
      ) : (
        <Box>No data available</Box>
      )}
    </WidgetWrapper>
  );
};

export default MetricsChart;
