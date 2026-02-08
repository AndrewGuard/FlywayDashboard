import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import honeycombTheme from './theme/honeycombTheme';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import MigrationHistory from './MigrationHistory';
import RoiCalculationPage from './RoiCalculationPage';
import ProjectConfiguration from './ProjectConfiguration';
import { useNotification } from './hooks/useNotification';

function App() {
  const { NotificationComponent } = useNotification();

  return (
    <ThemeProvider theme={honeycombTheme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex' }}>
          <Sidebar />
          <Box component="main" sx={{ flexGrow: 1, p: 3, backgroundColor: 'background.default', minHeight: '100vh' }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/migrations" element={<MigrationHistory />} />
              <Route path="/roi" element={<RoiCalculationPage />} />
              <Route path="/configuration" element={<ProjectConfiguration />} />
            </Routes>
          </Box>
        </Box>
      </Router>
      <NotificationComponent />
    </ThemeProvider>
  );
}

export default App;