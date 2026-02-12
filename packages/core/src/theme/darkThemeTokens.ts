/**
 * Tokens centralizados do dark mode.
 * Edite aqui para alterar todas as cores do tema escuro de uma vez.
 */
export const darkTokens = {
  // --- Fundos ---
  background: {
    default: '#1E1B2E',
    paper: '#2A2540',
  },

  // --- Textos ---
  text: {
    primary: '#E8E0F0',
    secondary: '#A99BBF',
  },

  // --- Cores principais ---
  primary: '#B494E8',
  secondary: '#F48FB1',

  // --- Divisores e bordas ---
  divider: 'rgba(156, 114, 217, 0.15)',
  cardBorder: 'rgba(156, 114, 217, 0.12)',
  cardShadow: '0 1px 4px rgba(100, 60, 180, 0.08)',

  // --- Sidebar ---
  sidebar: {
    bg: '#1E1B2E',
    activeText: '#E8E0F0',
    inactiveText: 'rgba(232, 224, 240, 0.7)',     // text.primary @ 70%
    activeIcon: '#B494E8',
    inactiveIcon: 'rgba(232, 224, 240, 0.7)',
    indicator: '#B494E8',
    selectedBg: 'rgba(180, 148, 232, 0.18)',       // primary @ 18%
    selectedHoverBg: 'rgba(180, 148, 232, 0.25)',  // primary @ 25%
    hoverBg: 'rgba(180, 148, 232, 0.10)',           // primary @ 10%
    brandBg: 'rgba(180, 148, 232, 0.22)',           // primary @ 22%
    divider: 'rgba(156, 114, 217, 0.15)',
  },

  // --- DataGrid / Tabelas ---
  dataGrid: {
    headerBg: '#2A2540',
    headerText: '#E8E0F0',
    headerBorder: 'rgba(156, 114, 217, 0.18)',
    cellText: '#A99BBF',
    cellBorder: 'rgba(156, 114, 217, 0.08)',
    hoverBg: 'rgba(180, 148, 232, 0.08)',
    outerBorder: 'rgba(156, 114, 217, 0.15)',
    footerInfoText: '#A99BBF',
    footerIconColor: '#A99BBF',
    toolbarBg: '#2A2540',
  },

  // --- Gráficos (Recharts) ---
  chart: {
    gridStroke: 'rgba(156, 114, 217, 0.12)',
    axisStroke: '#A99BBF',
    tooltipBg: '#2A2540',
    tooltipBorder: 'rgba(156, 114, 217, 0.2)',
    tooltipText: '#E8E0F0',
    labelFill: '#A99BBF',
  },
} as const;
