import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, Typography, Box, IconButton, Tooltip, Chip } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import DownloadIcon from '@mui/icons-material/Download';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { exportAsImage } from '../utils/exportUtils';

interface DataPoint {
  date: string;
  flywayLeadTime: number | null;
  nonFlywayLeadTime: number | null;
}

const LeadTimeOverTimeWidget: React.FC = () => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      await exportAsImage(cardRef.current, 'lead-time-for-changes');
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
        const refreshRes = await fetch('/api/metrics/lead-time-history/refresh');
        if (!refreshRes.ok) throw new Error('Failed to refresh lead time history');
        
        const data = await refreshRes.json();
        
        if (!mounted) return;

        const points = Array.isArray(data?.dataPoints) ? data.dataPoints : [];
        
        if (!points.length) {
          setError('No lead time history data available');
          setLoading(false);
          return;
        }

        setDataPoints(points);
        setLoading(false);
      } catch (err: any) {
        console.error('Lead time history error:', err);
        if (mounted) {
          setError(err.message || 'Failed to load lead time history');
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Lead Time for Changes</Typography>
          <Typography>Loading lead time history...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Lead Time for Changes</Typography>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  if (!dataPoints.length) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Lead Time for Changes</Typography>
          <Typography>No data available</Typography>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for MUI X-Charts
  const xAxisData = dataPoints.map(p => new Date(p.date));
  const flywayData = dataPoints.map(p => p.flywayLeadTime ?? null);
  const nonFlywayData = dataPoints.map(p => p.nonFlywayLeadTime ?? null);

  // Industry standard benchmarks (DORA metrics)
  // Elite: < 1 day, High: 1-7 days, Medium: 7-30 days, Low: > 30 days
  const eliteThreshold = dataPoints.map(() => 1);
  const highThreshold = dataPoints.map(() => 7);
  const mediumThreshold = dataPoints.map(() => 30);

  // Calculate average reduction for display (overall)
  const validFlyway = flywayData.filter((v): v is number => v !== null);
  const validBaseline = nonFlywayData.filter((v): v is number => v !== null);
  const avgFlyway = validFlyway.length > 0 ? validFlyway.reduce((a, b) => a + b, 0) / validFlyway.length : 0;
  const avgBaseline = validBaseline.length > 0 ? validBaseline.reduce((a, b) => a + b, 0) / validBaseline.length : 0;
  const reduction = avgBaseline > 0 ? Math.round(((avgBaseline - avgFlyway) / avgBaseline) * 100) : 0;

  // Calculate performance tier based on LAST 60 DAYS only
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  
  const recent60DaysData = dataPoints
    .filter(p => new Date(p.date) >= sixtyDaysAgo)
    .map(p => p.flywayLeadTime)
    .filter((v): v is number => v !== null && v >= 0);
  
  const avgFlywayRecent = recent60DaysData.length > 0 
    ? recent60DaysData.reduce((a, b) => a + b, 0) / recent60DaysData.length 
    : avgFlyway; // Fallback to overall average if < 60 days of data

  // Determine performance tier based on recent 60-day average
  let performanceTier = 'Low';
  let tierColor = '#f44336';
  if (avgFlywayRecent < 1) {
    performanceTier = 'Elite';
    tierColor = '#9c27b0';
  } else if (avgFlywayRecent < 7) {
    performanceTier = 'High';
    tierColor = '#4caf50';
  } else if (avgFlywayRecent < 30) {
    performanceTier = 'Medium';
    tierColor = '#ff9800';
  }

  return (
    <Card ref={cardRef} sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">Lead Time for Changes</Typography>
            {reduction > 0 && (
              <Chip
                icon={<TrendingDownIcon />}
                label={`${reduction}% reduction`}
                color="success"
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
            )}
            <Chip
              label={`${performanceTier} Performer`}
              size="small"
              sx={{ 
                fontWeight: 'bold',
                bgcolor: tierColor,
                color: 'white'
              }}
            />
          </Box>
          <Tooltip title="Download as image">
            <IconButton onClick={handleExport} disabled={exporting} size="small">
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Comparing Flyway vs Baseline vs Industry Standards (DORA) • Performance tier based on last 60 days • <Box component="span" sx={{ color: 'success.main', fontWeight: 'medium' }}>Lower is better</Box>
        </Typography>
        <Box sx={{ height: 400, mt: 2 }}>
          <LineChart
            xAxis={[{ 
              data: xAxisData, 
              scaleType: 'time',
              label: 'Date'
            }]}
            yAxis={[{ 
              label: 'Lead Time (days)',
              min: 0
            }]}
            series={[
              {
                data: flywayData,
                label: 'Flyway',
                color: '#4caf50',
                showMark: true,
                curve: 'linear'
              },
              {
                data: nonFlywayData,
                label: 'Baseline',
                color: '#f44336',
                showMark: true,
                curve: 'linear'
              },
              {
                data: eliteThreshold,
                label: 'Elite (< 1 day)',
                color: '#9c27b0',
                showMark: false,
                curve: 'linear',
                area: false
              },
              {
                data: highThreshold,
                label: 'High (< 7 days)',
                color: '#2196f3',
                showMark: false,
                curve: 'linear',
                area: false
              },
              {
                data: mediumThreshold,
                label: 'Medium (< 30 days)',
                color: '#ff9800',
                showMark: false,
                curve: 'linear',
                area: false
              }
            ]}
            height={350}
            margin={{ top: 20, right: 20, bottom: 80, left: 60 }}
            slotProps={{
              legend: {
                direction: 'row',
                position: { vertical: 'bottom', horizontal: 'middle' },
                padding: 0,
                itemMarkWidth: 12,
                itemMarkHeight: 12,
                markGap: 5,
                itemGap: 15,
              }
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default LeadTimeOverTimeWidget;