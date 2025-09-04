// Redgate Flyway color palette and theme overrides for MUI
import { createTheme } from '@mui/material/styles';

const flywayRed = '#d7263d';
const flywayDark = '#22223b';
const flywayGray = '#4a4e69';
const flywayLight = '#f2e9e4';
const flywayAccent = '#f46036';

const theme = createTheme({
  palette: {
    primary: {
      main: flywayRed,
      contrastText: '#fff',
    },
    secondary: {
      main: flywayAccent,
    },
    background: {
      default: flywayLight,
      paper: '#fff',
    },
    text: {
      primary: flywayDark,
      secondary: flywayGray,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: flywayRed,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: flywayDark,
          color: '#fff',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 12px 0 rgba(215,38,61,0.08)',
        },
      },
    },
  },
  typography: {
    fontFamily: 'Segoe UI, Arial, sans-serif',
    h6: {
      fontWeight: 700,
    },
  },
});

export default theme;
