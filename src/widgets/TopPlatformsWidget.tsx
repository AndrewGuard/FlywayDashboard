import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

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

const TopPlatformsWidget: React.FC = () => {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

        // Determine platform from dbType field or other indicators
        const platformTypes = {};
        
        migrations.forEach(m => {
          let platform = 'Other';
          
          // Check dbType field first (set by server)
          const dbType = m.dbType || m.db_type || '';
          if (dbType) {
            if (dbType.toLowerCase().includes('sql server') || dbType.toLowerCase().includes('sqlserver')) {
              platform = 'Microsoft SQL Server';
            } else if (dbType.toLowerCase().includes('postgres')) {
              platform = 'PostgreSQL';
            } else if (dbType.toLowerCase().includes('oracle')) {
              platform = 'Oracle';
            } else if (dbType.toLowerCase().includes('mysql') || dbType.toLowerCase().includes('mariadb')) {
              platform = 'MySQL';
            } else if (dbType.toLowerCase().includes('mongodb')) {
              platform = 'MongoDB';
            }
          }
          
          // Fallback: check database name, description, type fields
          if (platform === 'Other') {
            const desc = (m.description || '').toLowerCase();
            const db = (m.database || '').toLowerCase();
            const type = (m.type || '').toLowerCase();
            const combined = `${desc} ${db} ${type}`;
            
            if (combined.includes('sql server') || combined.includes('sqlserver') || combined.includes('mssql')) {
              platform = 'Microsoft SQL Server';
            } else if (combined.includes('postgres') || combined.includes('postgresql')) {
              platform = 'PostgreSQL';
            } else if (combined.includes('oracle')) {
              platform = 'Oracle';
            } else if (combined.includes('mysql') || combined.includes('mariadb')) {
              platform = 'MySQL';
            } else if (combined.includes('mongodb') || combined.includes('mongo')) {
              platform = 'MongoDB';
            }
          }
          
          platformTypes[platform] = (platformTypes[platform] || 0) + 1;
        });

        const labels = Object.keys(platformTypes);
        const values = Object.values(platformTypes) as number[];
        
        const colors = {
          'Microsoft SQL Server': 'rgba(0, 120, 215, 0.8)',
          'PostgreSQL': 'rgba(51, 103, 145, 0.8)',
          'Oracle': 'rgba(255, 0, 0, 0.8)',
          'MySQL': 'rgba(0, 117, 143, 0.8)',
          'MongoDB': 'rgba(0, 237, 100, 0.8)',
          'Other': 'rgba(158, 158, 158, 0.8)'
        };

        setChartData({
          labels,
          datasets: [{
            data: values,
            backgroundColor: labels.map(l => colors[l] || 'rgba(158, 158, 158, 0.8)'),
            borderWidth: 1
          }]
        });

        setLoading(false);
      } catch (err) {
        console.error('Top platforms error:', err);
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
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>Top Platforms</Typography>
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

export default TopPlatformsWidget;
