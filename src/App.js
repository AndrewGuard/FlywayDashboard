
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Sidebar from './Sidebar';
import MetricsCards from './MetricsCards';
import MetricsChart from './MetricsChart';
import TopPlatformsWidgets from './TopPlatformsWidgets';
import MigrationHistory from './MigrationHistory';

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
        <MetricsCards />
        <Box sx={{ mt: 4 }}>
          <MetricsChart />
        </Box>
        <MigrationHistory />
      </Box>
    </Box>
  );
}

export default App;
