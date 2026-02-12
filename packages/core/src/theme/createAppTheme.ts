import { createTheme, ThemeOptions } from '@mui/material';
import { darkTokens } from './darkThemeTokens';

const defaultThemeOptions: ThemeOptions = {
  shape: {
    borderRadius: 12,
  },
  palette: {
    background: {
      default: '#FAFAFA',
    },
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

const darkThemeOptions: ThemeOptions = {
  shape: {
    borderRadius: 12,
  },
  palette: {
    mode: 'dark',
    background: darkTokens.background,
    primary: { main: darkTokens.primary },
    secondary: { main: darkTokens.secondary },
    text: darkTokens.text,
    divider: darkTokens.divider,
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
          borderColor: darkTokens.cardBorder,
          boxShadow: darkTokens.cardShadow,
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

export function createAppThemeDark(overrides?: ThemeOptions) {
  return createTheme({
    ...darkThemeOptions,
    ...overrides,
    palette: {
      ...darkThemeOptions.palette,
      ...overrides?.palette,
      background: {
        ...darkTokens.background,
        ...overrides?.palette?.background,
      },
    },
    typography: {
      ...darkThemeOptions.typography,
      ...overrides?.typography,
    },
    components: {
      ...darkThemeOptions.components,
      ...overrides?.components,
    },
  });
}

export function createAppTheme(overrides?: ThemeOptions) {
  return createTheme({
    ...defaultThemeOptions,
    ...overrides,
    palette: {
      ...defaultThemeOptions.palette,
      ...overrides?.palette,
      background: {
        ...defaultThemeOptions.palette?.background,
        ...overrides?.palette?.background,
      },
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
