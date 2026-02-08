import React from 'react';
import { Box } from '@mui/material';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { WidgetWrapper } from '../components/WidgetWrapper';
import { useMigrationHistory } from '../hooks/useFlywayData';
import { processPieChartData } from '../utils/chartDataProcessing';

ChartJS.register(ArcElement, Tooltip, Legend);

const TopDatabasesWidget: React.FC = () => {
  const { data: migrations, loading, error } = useMigrationHistory();

  const chartData = migrations ? processPieChartData(
    migrations,
    (m) => m.database || m.type || 'Unknown'
  ) : null;

  return (
    <WidgetWrapper 
      title="Top Databases" 
      loading={loading} 
      error={error}
      exportFilename="top-databases"
    >
      {chartData ? (
        <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
          <Pie data={chartData} options={{ maintainAspectRatio: false }} />
        </Box>
      ) : (
        <Box>No data available</Box>
      )}
    </WidgetWrapper>
  );
};

export default TopDatabasesWidget;
