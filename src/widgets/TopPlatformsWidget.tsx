import React from 'react';
import { Box } from '@mui/material';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { WidgetWrapper } from '../components/WidgetWrapper';
import { useMigrationHistory } from '../hooks/useFlywayData';
import { processPieChartData, extractPlatform, CHART_COLORS } from '../utils/chartDataProcessing';

ChartJS.register(ArcElement, Tooltip, Legend);

const TopPlatformsWidget: React.FC = () => {
  const { data: migrations, loading, error } = useMigrationHistory();

  const chartData = migrations ? processPieChartData(
    migrations,
    extractPlatform,
    CHART_COLORS.platforms
  ) : null;

  return (
    <WidgetWrapper 
      title="Top Platforms" 
      loading={loading} 
      error={error}
      exportFilename="top-platforms"
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

export default TopPlatformsWidget;
