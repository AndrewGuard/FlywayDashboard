import React from 'react';
import { useNavigate } from 'react-router-dom';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BarChartIcon from '@mui/icons-material/BarChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import UndoIcon from '@mui/icons-material/Undo';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import TableChartIcon from '@mui/icons-material/TableChart';
import SettingsIcon from '@mui/icons-material/Settings';
import logo from './logo.svg';
import { Box, Typography, Divider } from '@mui/material';

interface NavItem {
  text: string;
  icon: React.ReactElement;
  section: string;
}

const navItems: NavItem[] = [
  { text: 'Change in Deployment Metrics', icon: <BarChartIcon />, section: 'change-in-deployment-metrics' },
  { text: 'DORA ROI Calculation', icon: <QueryStatsIcon />, section: 'roi-calculation' },
  { text: 'Deployments Over Time', icon: <TimelineIcon />, section: 'deployments-over-time' },
  { text: 'Top Platforms', icon: <DashboardIcon />, section: 'top-platforms' },
  { text: 'Deployment Success Rate', icon: <QueryStatsIcon />, section: 'deployment-success-rate' },
  { text: 'Undo Migrations', icon: <UndoIcon />, section: 'undo-migrations' },
  { text: 'Avg Deployment Time', icon: <BarChartIcon />, section: 'avg-deployment-time' },
  { text: 'Metrics Chart', icon: <BarChartIcon />, section: 'metrics-chart' },
  { text: 'Migration History', icon: <TableChartIcon />, section: 'migration-history' }
];

const configItems: NavItem[] = [
  { text: 'Project Configuration', icon: <SettingsIcon />, section: 'configuration' }
];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();

  const handleNavClick = (section: string) => {
    if (section === 'configuration') {
      navigate('/configuration');
    } else if (section === 'migration-history') {
      navigate('/migrations');
    } else if (section === 'roi-calculation') {
      navigate('/roi');
    } else {
      // All other sections go to home and scroll
      navigate('/');
      // Wait for route to render, then scroll to section
      setTimeout(() => {
        const el = document.getElementById(section);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };
  return (
    <Drawer variant="permanent" anchor="left" sx={{ width: 220, flexShrink: 0, '& .MuiDrawer-paper': { width: 220, boxSizing: 'border-box', backgroundColor: '#22223b', color: '#fff' } }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3, mb: 2 }}>
        <img src={logo} alt="Flyway Logo" style={{ width: 48, marginBottom: 8 }} />
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#d7263d', letterSpacing: 1 }}>
          Flyway
        </Typography>
        <Typography variant="caption" sx={{ color: '#fff', opacity: 0.7 }}>
          by Redgate
        </Typography>
      </Box>
      <List>
        {navItems.map((item) => (
          <ListItem button key={item.text} onClick={() => handleNavClick(item.section)} sx={{ '&:hover': { backgroundColor: '#4a4e69' } }}>
            <ListItemIcon sx={{ color: '#fff' }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      
      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.2)', my: 2 }} />
      
      <List>
        {configItems.map((item) => (
          <ListItem button key={item.text} onClick={() => handleNavClick(item.section)} sx={{ '&:hover': { backgroundColor: '#4a4e69' } }}>
            <ListItemIcon sx={{ color: '#fff' }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;
