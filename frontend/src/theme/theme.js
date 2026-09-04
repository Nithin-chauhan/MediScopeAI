import { createTheme } from '@mui/material/styles';

const getDesignTokens = (mode) => ({
  palette: {
    mode,
    primary: {
      main: '#2563EB', // Medical Blue
      light: '#60A5FA',
      dark: '#1D4ED8',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#4F46E5', // Indigo
      light: '#818CF8',
      dark: '#3730A3',
    },
    info: {
      main: '#06B6D4', // Cyan Accent
    },
    success: {
      main: '#10B981', // Green
    },
    warning: {
      main: '#F59E0B', // Orange
    },
    error: {
      main: '#EF4444', // Red
    },
    background: {
      default: mode === 'light' ? '#F4F7FE' : '#0B1120',
      paper: mode === 'light' ? '#FFFFFF' : '#162032',
    },
    text: {
      primary: mode === 'light' ? '#1B2559' : '#F8FAFC',
      secondary: mode === 'light' ? '#A3AED0' : '#94A3B8',
    },
    divider: mode === 'light' ? '#E2E8F0' : '#334155',
  },
  typography: {
    fontFamily: '"Inter", "SF Pro Display", "Plus Jakarta Sans", system-ui, sans-serif',
    h1: { fontWeight: 700, fontSize: '2.5rem', letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, fontSize: '2rem', letterSpacing: '-0.02em' },
    h3: { fontWeight: 600, fontSize: '1.75rem', letterSpacing: '-0.01em' },
    h4: { fontWeight: 600, fontSize: '1.5rem', letterSpacing: '-0.01em' },
    h5: { fontWeight: 600, fontSize: '1.25rem' },
    h6: { fontWeight: 600, fontSize: '1rem' },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 500, color: '#64748B' },
    body1: { fontSize: '0.95rem' },
    body2: { fontSize: '0.875rem' },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12, // Match --radius-lg
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          padding: '8px 20px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          },
        },
        containedPrimary: {
          backgroundImage: 'linear-gradient(to right, #2563EB, #4F46E5)',
          '&:hover': {
            backgroundImage: 'linear-gradient(to right, #1D4ED8, #3730A3)',
          },
        }
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: mode === 'light' 
            ? '0px 18px 40px rgba(112, 144, 176, 0.12)' 
            : '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
          border: 'none',
          borderRadius: '16px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: mode === 'light' ? '#F8FAFC' : '#0B1120',
          borderBottom: `1px solid ${mode === 'light' ? '#E2E8F0' : '#334155'}`,
        },
        root: {
          borderBottom: `1px solid ${mode === 'light' ? '#F1F5F9' : '#1E293B'}`,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
          },
        },
      },
    },
  },
});

export const theme = (mode) => createTheme(getDesignTokens(mode));
