
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

function App() {
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
  <div id="top-platforms"><TopPlatformsWidgets /></div>
  <div id="deployments-over-time"><DeploymentsOverTimeWidget /></div>
  <div id="deployment-success-rate"><DeploymentSuccessRate /></div>
  <div id="undo-migrations"><UndoMigrationsWidget /></div>
  <div id="avg-deployment-time"><AverageDeploymentTimeWidget /></div>
  <Box id="metrics-chart" sx={{ mt: 4 }}>
    <MetricsChart />
  </Box>
  <div id="migration-history"><MigrationHistory /></div>
      </Box>
    </Box>
  );
}

export default App;
