import React from 'react';
import { Box } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import { WidgetWrapper } from '../components/WidgetWrapper';
import { useMigrationHistory } from '../hooks/useFlywayData';
import { processAverageDeploymentTime } from '../utils/chartDataProcessing';
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

const AverageDeploymentTimeWidget: React.FC = () => {
  const { data: migrations, loading, error } = useMigrationHistory();

  const chartData = migrations ? processAverageDeploymentTime(migrations) : null;

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
    <WidgetWrapper 
      title="Average Deployment Time per Database" 
      loading={loading} 
      error={error}
      exportFilename="average-deployment-time"
    >
      {chartData ? (
        <Box sx={{ height: 300 }}>
          <Bar data={chartData} options={options} />
        </Box>
      ) : (
        <Box>No data available</Box>
      )}
    </WidgetWrapper>
  );
};

export default AverageDeploymentTimeWidget;
