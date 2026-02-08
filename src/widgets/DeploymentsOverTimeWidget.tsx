import React from 'react';
import { Box } from '@mui/material';
import { Line } from 'react-chartjs-2';
import { WidgetWrapper } from '../components/WidgetWrapper';
import { useMigrationHistory } from '../hooks/useFlywayData';
import { processDeploymentsOverTime } from '../utils/chartDataProcessing';
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

const DeploymentsOverTimeWidget: React.FC = () => {
  const { data: migrations, loading, error } = useMigrationHistory();

  const chartData = migrations ? processDeploymentsOverTime(migrations) : null;

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Deployments Over Time by Database' }
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Deployments' } },
      x: { title: { display: true, text: 'Date' } }
    }
  };

  return (
    <WidgetWrapper 
      title="Deployments Over Time by Database" 
      loading={loading} 
      error={error}
      exportFilename="deployments-over-time"
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

export default DeploymentsOverTimeWidget;
