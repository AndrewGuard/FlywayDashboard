
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
  <TopPlatformsWidgets />
  <DeploymentSuccessRate />
  <UndoMigrationsWidget />
  {/* <MetricsCards /> */}
        <Box sx={{ mt: 4 }}>
          <MetricsChart />
        </Box>
  <MigrationHistory />
  {/* <JdbcConnectionsList /> */}
      </Box>
    </Box>
  );
}

export default App;
