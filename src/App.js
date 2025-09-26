import React from 'react';
import './chartjsSetup'; // ensure chart.js components are registered before any chart renders
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Sidebar from './Sidebar';
import MetricsChart from './MetricsChart';
import TopPlatformsWidgets from './TopPlatformsWidgets';
import MigrationHistory from './MigrationHistory';
import DeploymentSuccessRate from './DeploymentSuccessRate';
import UndoMigrationsWidget from './UndoMigrationsWidget';
import DeploymentsOverTimeWidget from './DeploymentsOverTimeWidget';
import AverageDeploymentTimeWidget from './AverageDeploymentTimeWidget';
import UserDefinedMetricsPage from './UserDefinedMetricsPage';
import ChangeInDeploymentMetricsWidget from './ChangeInDeploymentMetricsWidget';
import RoiCalculationPage from './RoiCalculationPage';
import LeadTimeForChangesOverTimeWidget from './LeadTimeForChangesOverTimeWidget';
import TotalMigrationsOverTimeWidget from './TotalMigrationsOverTimeWidget';
import { useEffect, useState } from 'react';

function App() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            Flyway Dashboard
          </Typography>
        </Toolbar>
      </AppBar>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {hash === '#/user-defined-metrics' ? (
          <div id="user-defined-metrics"><UserDefinedMetricsPage /></div>
        ) : hash === '#/roi-calculation' ? (
          <RoiCalculationPage />
        ) : (
          <>
            <div id="change-in-deployment-metrics"><ChangeInDeploymentMetricsWidget /></div>
            <div id="lead-time-for-changes-over-time"><LeadTimeForChangesOverTimeWidget /></div>
            <div id="deployments-over-time"><DeploymentsOverTimeWidget /></div>
            <div id="total-migrations-over-time"><TotalMigrationsOverTimeWidget /></div>  {/* moved here */} 
            <div id="top-platforms"><TopPlatformsWidgets /></div>
            <div id="deployment-success-rate"><DeploymentSuccessRate /></div>
            <div id="undo-migrations"><UndoMigrationsWidget /></div>
            <div id="avg-deployment-time"><AverageDeploymentTimeWidget /></div>
            <Box id="metrics-chart" sx={{ mt: 4 }}>
              <MetricsChart />
            </Box>
            <div id="migration-history"><MigrationHistory /></div>
          </>
        )}
      </Box>
    </Box>
  );
}

export default App;
