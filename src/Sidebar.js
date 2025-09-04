import React from 'react';
import ReactDOM from 'react-dom/client';
// import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import { Box, Typography } from '@mui/material';
import logo from './logo.svg';

const navItems = [
  { text: 'Dashboard', icon: <DashboardIcon /> },
  { text: 'Metrics', icon: <BarChartIcon /> },
  { text: 'Settings', icon: <SettingsIcon /> },
];

export default function Sidebar() {
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
        {navItems.map((item, index) => (
          <ListItem button key={item.text} sx={{ '&:hover': { backgroundColor: '#4a4e69' } }}>
            <ListItemIcon sx={{ color: '#fff' }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}
