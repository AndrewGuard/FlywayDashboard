/**
 * Shared widget wrapper component
 * Eliminates duplicate boilerplate for loading, error handling, and export functionality
 */

import React, { useRef, useState, ReactNode } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { exportAsImage } from '../utils/exportUtils';

interface WidgetWrapperProps {
  title: string;
  loading?: boolean;
  error?: string | null;
  children: ReactNode;
  exportFilename?: string;
  headerActions?: ReactNode;
  subtitle?: string;
}

/**
 * Wrapper component for dashboard widgets
 * Handles loading states, error states, and export functionality
 * 
 * Usage:
 * ```tsx
 * <WidgetWrapper title="My Widget" loading={loading} error={error} exportFilename="my-widget">
 *   <YourChartComponent />
 * </WidgetWrapper>
 * ```
 */
export const WidgetWrapper: React.FC<WidgetWrapperProps> = ({
  title,
  loading = false,
  error = null,
  children,
  exportFilename,
  headerActions,
  subtitle
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!cardRef.current || !exportFilename) return;
    setExporting(true);
    try {
      await exportAsImage(cardRef.current, exportFilename);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card ref={cardRef} sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box>
            <Typography variant="h6">{title}</Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {headerActions}
            {exportFilename && (
              <Tooltip title="Download as image">
                <IconButton onClick={handleExport} disabled={exporting} size="small">
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
};

export default WidgetWrapper;
