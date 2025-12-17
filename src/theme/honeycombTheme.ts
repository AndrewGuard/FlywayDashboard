import { createTheme, ThemeOptions } from '@mui/material/styles';

// Honeycomb color palette extracted from Redgate's design system
const honeycombColors = {
  // Primary - Blue (used for main actions, navigation, links)
  primary: {
    main: '#1976D2',
    light: '#42A5F5',
    dark: '#1565C0',
    contrastText: '#FFFFFF',
  },
  
  // Secondary - Gray (used for secondary actions, borders)
  secondary: {
    main: '#424242',
    light: '#616161',
    dark: '#212121',
    contrastText: '#FFFFFF',
  },
  
  // Success - Green (Flyway improvements, positive metrics)
  success: {
    main: '#2E7D32',
    light: '#4CAF50',
    dark: '#1B5E20',
    contrastText: '#FFFFFF',
  },
  
  // Error - Red (failures, rollbacks, negative metrics)
  error: {
    main: '#C62828',
    light: '#EF5350',
    dark: '#B71C1C',
    contrastText: '#FFFFFF',
  },
  
  // Warning - Orange (alerts, manual deployments)
  warning: {
    main: '#ED6C02',
    light: '#FF9800',
    dark: '#E65100',
    contrastText: '#FFFFFF',
  },
  
  // Info - Light Blue (informational states, tooltips)
  info: {
    main: '#0288D1',
    light: '#03A9F4',
    dark: '#01579B',
    contrastText: '#FFFFFF',
  },
  
  // Background hierarchy
  background: {
    default: '#F5F5F5',      // Overall page background
    paper: '#FFFFFF',         // Card/Paper backgrounds
    elevated: '#FAFAFA',      // Slightly elevated surfaces
  },
  
  // Text hierarchy from Honeycomb
  text: {
    primary: '#212121',       // Primary text (headings, labels)
    secondary: '#616161',     // Secondary text (descriptions)
    disabled: '#9E9E9E',      // Disabled state text
  },
  
  // Dividers and borders
  divider: 'rgba(0, 0, 0, 0.12)',
};

// Typography scale matching Honeycomb
const honeycombTypography = {
  fontFamily: [
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
  ].join(','),
  
  // Heading styles
  h1: {
    fontSize: '2.5rem',      // 40px
    fontWeight: 600,
    lineHeight: 1.2,
    letterSpacing: '-0.01562em',
  },
  h2: {
    fontSize: '2rem',        // 32px
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: '-0.00833em',
  },
  h3: {
    fontSize: '1.75rem',     // 28px
    fontWeight: 600,
    lineHeight: 1.35,
  },
  h4: {
    fontSize: '1.5rem',      // 24px
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h5: {
    fontSize: '1.25rem',     // 20px
    fontWeight: 600,
    lineHeight: 1.45,
  },
  h6: {
    fontSize: '1rem',        // 16px
    fontWeight: 600,
    lineHeight: 1.5,
  },
  
  // Body text
  body1: {
    fontSize: '1rem',        // 16px
    lineHeight: 1.5,
    letterSpacing: '0.00938em',
  },
  body2: {
    fontSize: '0.875rem',    // 14px
    lineHeight: 1.43,
    letterSpacing: '0.01071em',
  },
  
  // UI elements
  button: {
    fontSize: '0.875rem',    // 14px
    fontWeight: 500,
    lineHeight: 1.75,
    letterSpacing: '0.02857em',
    textTransform: 'none',   // Honeycomb uses sentence case for buttons
  },
  caption: {
    fontSize: '0.75rem',     // 12px
    lineHeight: 1.66,
    letterSpacing: '0.03333em',
    color: honeycombColors.text.secondary,
  },
  overline: {
    fontSize: '0.75rem',     // 12px
    fontWeight: 600,
    lineHeight: 2.66,
    letterSpacing: '0.08333em',
    textTransform: 'uppercase',
  },
};

// Spacing system - 8px grid
const honeycombSpacing = 8;

// Component overrides for Honeycomb styling
const honeycombComponents: ThemeOptions['components'] = {
  // Card styling with elevation
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.08), 0px 4px 8px rgba(0, 0, 0, 0.04)',
        transition: 'box-shadow 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.12), 0px 8px 16px rgba(0, 0, 0, 0.08)',
        },
      },
    },
  },
  
  // Button styling - filled Material style
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 4,
        padding: '8px 16px',
        fontWeight: 500,
        boxShadow: 'none',
        '&:hover': {
          boxShadow: 'none',
        },
      },
      contained: {
        '&:hover': {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.16)',
        },
      },
    },
  },
  
  // Paper backgrounds
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
      },
      elevation1: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.08)',
      },
      elevation2: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.08), 0px 4px 8px rgba(0, 0, 0, 0.04)',
      },
      elevation3: {
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.12), 0px 8px 16px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  
  // Chip styling for badges/tags
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 16,
        fontWeight: 500,
      },
      filled: {
        '&.MuiChip-colorSuccess': {
          backgroundColor: honeycombColors.success.light,
          color: '#FFFFFF',
        },
        '&.MuiChip-colorError': {
          backgroundColor: honeycombColors.error.light,
          color: '#FFFFFF',
        },
        '&.MuiChip-colorWarning': {
          backgroundColor: honeycombColors.warning.light,
          color: '#FFFFFF',
        },
      },
    },
  },
  
  // Table styling with Paper background
  MuiTableContainer: {
    styleOverrides: {
      root: {
        backgroundColor: honeycombColors.background.paper,
        borderRadius: 8,
      },
    },
  },
  
  MuiTableHead: {
    styleOverrides: {
      root: {
        backgroundColor: honeycombColors.background.elevated,
        '& .MuiTableCell-head': {
          fontWeight: 600,
          color: honeycombColors.text.primary,
        },
      },
    },
  },
  
  // List items with hover states
  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        '&.Mui-selected': {
          backgroundColor: 'rgba(25, 118, 210, 0.08)',
          '&:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.12)',
          },
        },
      },
    },
  },
};

// Create the theme
const honeycombTheme = createTheme({
  palette: {
    mode: 'light',
    ...honeycombColors,
  },
  typography: honeycombTypography,
  spacing: honeycombSpacing,
  shape: {
    borderRadius: 8,
  },
  components: honeycombComponents,
});

export default honeycombTheme;