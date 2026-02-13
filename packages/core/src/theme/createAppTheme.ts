import { createTheme, ThemeOptions } from '@mui/material';
import { darkTokens, getThemeTokens, type DarkThemeTokens } from './darkThemeTokens';
import type { SidebarTema } from '../types';

// ─── Light (base) ───────────────────────────────────────────────────────────

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

// ─── Dark (generic) ─────────────────────────────────────────────────────────

export function createDarkTheme(tokens: DarkThemeTokens, overrides?: ThemeOptions) {
  // For dark themes, the token palette is authoritative.
  // App-level overrides only affect shape, typography, and components.
  const { palette: _ignored, ...nonPaletteOverrides } = overrides ?? {};

  return createTheme({
    shape: { borderRadius: 12 },
    ...nonPaletteOverrides,
    palette: {
      mode: 'dark',
      background: tokens.background,
      primary: { main: tokens.primary },
      secondary: { main: tokens.secondary },
      text: tokens.text,
      divider: tokens.divider,
    },
    typography: {
      fontFamily: '"Plus Jakarta Sans", "Roboto", "Helvetica", "Arial", sans-serif',
      button: { textTransform: 'none', fontWeight: 600 },
      ...nonPaletteOverrides.typography,
    },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: { root: { borderRadius: 8 } },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: '1px solid',
            borderColor: tokens.cardBorder,
            boxShadow: tokens.cardShadow,
          },
        },
      },
      MuiPaper: { defaultProps: { elevation: 0 } },
      MuiTableHead: {
        styleOverrides: {
          root: { '& .MuiTableCell-head': { fontWeight: 600 } },
        },
      },
      ...nonPaletteOverrides.components,
    },
  });
}

// ─── Light theme variants ───────────────────────────────────────────────────

const lightThemeVariants: Partial<Record<SidebarTema, ThemeOptions>> = {
  pet: {
    palette: {
      primary: { main: '#9C72D9' },
      secondary: { main: '#F48FB1' },
      background: { default: '#FAF8FF' },
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
        defaultProps: { disableElevation: true },
        styleOverrides: { root: { borderRadius: 20, textTransform: 'none' as const } },
      },
      MuiTextField: {
        styleOverrides: {
          root: { '& .MuiOutlinedInput-root': { borderRadius: 12 } },
        },
      },
      MuiChip: {
        styleOverrides: { root: { borderRadius: 9999 } },
      },
    },
  },

  escuro: {
    palette: {
      primary: { main: '#B494E8' },
      secondary: { main: '#F48FB1' },
      background: { default: '#F8F5FF' },
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            border: '1px solid rgba(180, 148, 232, 0.18)',
            boxShadow: '0 2px 10px rgba(180, 148, 232, 0.08)',
          },
        },
      },
    },
  },

  oceano: {
    palette: {
      primary: { main: '#00ACC1' },
      secondary: { main: '#80DEEA' },
      background: { default: '#F0FAFB' },
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            border: '1px solid rgba(0, 172, 193, 0.15)',
            boxShadow: '0 2px 10px rgba(0, 172, 193, 0.08)',
          },
        },
      },
    },
  },

  sunset: {
    palette: {
      primary: { main: '#FB8C00' },
      secondary: { main: '#FF8A65' },
      background: { default: '#FFFAF5' },
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            border: '1px solid rgba(251, 140, 0, 0.15)',
            boxShadow: '0 2px 10px rgba(251, 140, 0, 0.08)',
          },
        },
      },
    },
  },

  nord: {
    palette: {
      primary: { main: '#5E81AC' },
      secondary: { main: '#81A1C1' },
      background: { default: '#F5F7FA' },
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            border: '1px solid rgba(94, 129, 172, 0.15)',
            boxShadow: '0 2px 10px rgba(94, 129, 172, 0.08)',
          },
        },
      },
    },
  },

  azul: {
    palette: {
      primary: { main: '#2979FF' },
      secondary: { main: '#448AFF' },
      background: { default: '#F0F5FF' },
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            border: '1px solid rgba(41, 121, 255, 0.15)',
            boxShadow: '0 2px 10px rgba(41, 121, 255, 0.08)',
          },
        },
      },
    },
  },
};

// ─── Convenience: create theme by SidebarTema name ──────────────────────────

export function createThemeForTema(tema: SidebarTema, overrides?: ThemeOptions) {
  // Light theme variants: use variant palette, ignore app palette
  const lightVariant = lightThemeVariants[tema];
  if (lightVariant) {
    const { palette: _ignored, ...nonPaletteOverrides } = overrides ?? {};
    return createAppTheme({
      ...nonPaletteOverrides,
      palette: lightVariant.palette,
      components: {
        ...nonPaletteOverrides.components,
        ...lightVariant.components,
      },
    });
  }

  // Dark themes (if any in darkThemeRegistry)
  const tokens = getThemeTokens(tema);
  if (tokens) {
    return createDarkTheme(tokens, overrides);
  }

  // Default light (claro): use app overrides as-is
  return createAppTheme(overrides);
}

// ─── Backward compat ────────────────────────────────────────────────────────

/** @deprecated Use `createDarkTheme` or `createThemeForTema` instead. */
export function createAppThemeDark(overrides?: ThemeOptions) {
  return createDarkTheme(darkTokens, overrides);
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
