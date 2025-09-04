import Sidebar from './Sidebar';
import MetricsCards from './MetricsCards';
import MetricsChart from './MetricsChart';
import { Box, CssBaseline, Toolbar, AppBar, Typography, Container } from '@mui/material';

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
        <MetricsCards />
        <Box sx={{ mt: 4 }}>
          <MetricsChart />
        </Box>
      </Box>
    </Box>
  );
}

export default App;
