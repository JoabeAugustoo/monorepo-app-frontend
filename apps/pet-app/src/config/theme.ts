import { ThemeOptions } from '@mui/material';

export const themeOptions: ThemeOptions = {
  palette: {
    primary: { main: '#9C72D9' },
    secondary: { main: '#F48FB1' },
    background: {
      default: '#FAF8FF',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid rgba(156, 114, 217, 0.15)',
          boxShadow: '0 2px 12px rgba(156, 114, 217, 0.08)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          textTransform: 'none' as const,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 9999,
        },
      },
    },
    MuiStepIcon: {
      styleOverrides: {
        root: {
          '&.Mui-active': {
            color: '#9C72D9',
          },
          '&.Mui-completed': {
            color: '#9C72D9',
          },
        },
      },
    },
  },
};
