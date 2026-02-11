import { createTheme, ThemeOptions } from '@mui/material';

const defaultThemeOptions: ThemeOptions = {
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Roboto", "Helvetica", "Arial", sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid',
          borderColor: 'rgba(0, 0, 0, 0.08)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontWeight: 600,
          },
        },
      },
    },
  },
};

export function createAppTheme(overrides?: ThemeOptions) {
  return createTheme({
    ...defaultThemeOptions,
    ...overrides,
    palette: {
      ...defaultThemeOptions.palette,
      ...overrides?.palette,
    },
    typography: {
      ...defaultThemeOptions.typography,
      ...overrides?.typography,
    },
    components: {
      ...defaultThemeOptions.components,
      ...overrides?.components,
    },
  });
}
