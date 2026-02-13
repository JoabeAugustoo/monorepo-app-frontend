import type { SidebarTema } from '../types';

/**
 * Shape dos tokens de dark mode.
 */
export interface DarkThemeTokens {
  background: { default: string; paper: string };
  text: { primary: string; secondary: string };
  primary: string;
  secondary: string;
  divider: string;
  cardBorder: string;
  cardShadow: string;
  sidebar: {
    bg: string;
    activeText: string;
    inactiveText: string;
    activeIcon: string;
    inactiveIcon: string;
    indicator: string;
    selectedBg: string;
    selectedHoverBg: string;
    hoverBg: string;
    brandBg: string;
    divider: string;
  };
  dataGrid: {
    headerBg: string;
    headerText: string;
    headerBorder: string;
    rowBg: string;
    rowAltBg: string;
    cellText: string;
    cellBorder: string;
    hoverBg: string;
    outerBorder: string;
    footerBg: string;
    footerInfoText: string;
    footerIconColor: string;
    toolbarBg: string;
  };
  chart: {
    gridStroke: string;
    axisStroke: string;
    tooltipBg: string;
    tooltipBorder: string;
    tooltipText: string;
    labelFill: string;
  };
}

// ─── Escuro (Purple) ────────────────────────────────────────────────────────
const escuroTokens: DarkThemeTokens = {
  background: { default: '#1E1B2E', paper: '#2A2540' },
  text: { primary: '#E8E0F0', secondary: '#A99BBF' },
  primary: '#B494E8',
  secondary: '#F48FB1',
  divider: 'rgba(156, 114, 217, 0.15)',
  cardBorder: 'rgba(156, 114, 217, 0.12)',
  cardShadow: '0 1px 4px rgba(100, 60, 180, 0.08)',
  sidebar: {
    bg: '#1E1B2E',
    activeText: '#E8E0F0',
    inactiveText: 'rgba(232, 224, 240, 0.7)',
    activeIcon: '#B494E8',
    inactiveIcon: 'rgba(232, 224, 240, 0.7)',
    indicator: '#B494E8',
    selectedBg: 'rgba(180, 148, 232, 0.18)',
    selectedHoverBg: 'rgba(180, 148, 232, 0.25)',
    hoverBg: 'rgba(180, 148, 232, 0.10)',
    brandBg: 'rgba(180, 148, 232, 0.22)',
    divider: 'rgba(156, 114, 217, 0.15)',
  },
  dataGrid: {
    headerBg: '#2A2540',
    headerText: '#E8E0F0',
    headerBorder: 'rgba(156, 114, 217, 0.18)',
    rowBg: '#2E2A47',
    rowAltBg: '#322D4C',
    cellText: '#A99BBF',
    cellBorder: 'rgba(156, 114, 217, 0.08)',
    hoverBg: 'rgba(180, 148, 232, 0.12)',
    outerBorder: 'rgba(156, 114, 217, 0.15)',
    footerBg: '#2A2540',
    footerInfoText: '#A99BBF',
    footerIconColor: '#A99BBF',
    toolbarBg: '#2A2540',
  },
  chart: {
    gridStroke: 'rgba(156, 114, 217, 0.12)',
    axisStroke: '#A99BBF',
    tooltipBg: '#2A2540',
    tooltipBorder: 'rgba(156, 114, 217, 0.2)',
    tooltipText: '#E8E0F0',
    labelFill: '#A99BBF',
  },
};

// ─── Oceano (Teal / Cyan) ───────────────────────────────────────────────────
const oceanoTokens: DarkThemeTokens = {
  background: { default: '#0F1B2D', paper: '#162438' },
  text: { primary: '#E0F0F4', secondary: '#8BAAB8' },
  primary: '#4DD0E1',
  secondary: '#80DEEA',
  divider: 'rgba(77, 208, 225, 0.15)',
  cardBorder: 'rgba(77, 208, 225, 0.12)',
  cardShadow: '0 1px 4px rgba(15, 27, 45, 0.12)',
  sidebar: {
    bg: '#0F1B2D',
    activeText: '#E0F0F4',
    inactiveText: 'rgba(224, 240, 244, 0.7)',
    activeIcon: '#4DD0E1',
    inactiveIcon: 'rgba(224, 240, 244, 0.7)',
    indicator: '#4DD0E1',
    selectedBg: 'rgba(77, 208, 225, 0.18)',
    selectedHoverBg: 'rgba(77, 208, 225, 0.25)',
    hoverBg: 'rgba(77, 208, 225, 0.10)',
    brandBg: 'rgba(77, 208, 225, 0.22)',
    divider: 'rgba(77, 208, 225, 0.15)',
  },
  dataGrid: {
    headerBg: '#162438',
    headerText: '#E0F0F4',
    headerBorder: 'rgba(77, 208, 225, 0.18)',
    rowBg: '#1A2B3F',
    rowAltBg: '#1E3248',
    cellText: '#8BAAB8',
    cellBorder: 'rgba(77, 208, 225, 0.08)',
    hoverBg: 'rgba(77, 208, 225, 0.12)',
    outerBorder: 'rgba(77, 208, 225, 0.15)',
    footerBg: '#162438',
    footerInfoText: '#8BAAB8',
    footerIconColor: '#8BAAB8',
    toolbarBg: '#162438',
  },
  chart: {
    gridStroke: 'rgba(77, 208, 225, 0.12)',
    axisStroke: '#8BAAB8',
    tooltipBg: '#162438',
    tooltipBorder: 'rgba(77, 208, 225, 0.2)',
    tooltipText: '#E0F0F4',
    labelFill: '#8BAAB8',
  },
};

// ─── Sunset (Orange / Amber) ────────────────────────────────────────────────
const sunsetTokens: DarkThemeTokens = {
  background: { default: '#1A1410', paper: '#2A2118' },
  text: { primary: '#F5EDE4', secondary: '#B8A494' },
  primary: '#FFB74D',
  secondary: '#FF8A65',
  divider: 'rgba(255, 183, 77, 0.15)',
  cardBorder: 'rgba(255, 183, 77, 0.12)',
  cardShadow: '0 1px 4px rgba(26, 20, 16, 0.12)',
  sidebar: {
    bg: '#1A1410',
    activeText: '#F5EDE4',
    inactiveText: 'rgba(245, 237, 228, 0.7)',
    activeIcon: '#FFB74D',
    inactiveIcon: 'rgba(245, 237, 228, 0.7)',
    indicator: '#FFB74D',
    selectedBg: 'rgba(255, 183, 77, 0.18)',
    selectedHoverBg: 'rgba(255, 183, 77, 0.25)',
    hoverBg: 'rgba(255, 183, 77, 0.10)',
    brandBg: 'rgba(255, 183, 77, 0.22)',
    divider: 'rgba(255, 183, 77, 0.15)',
  },
  dataGrid: {
    headerBg: '#2A2118',
    headerText: '#F5EDE4',
    headerBorder: 'rgba(255, 183, 77, 0.18)',
    rowBg: '#2E2419',
    rowAltBg: '#352A1E',
    cellText: '#B8A494',
    cellBorder: 'rgba(255, 183, 77, 0.08)',
    hoverBg: 'rgba(255, 183, 77, 0.12)',
    outerBorder: 'rgba(255, 183, 77, 0.15)',
    footerBg: '#2A2118',
    footerInfoText: '#B8A494',
    footerIconColor: '#B8A494',
    toolbarBg: '#2A2118',
  },
  chart: {
    gridStroke: 'rgba(255, 183, 77, 0.12)',
    axisStroke: '#B8A494',
    tooltipBg: '#2A2118',
    tooltipBorder: 'rgba(255, 183, 77, 0.2)',
    tooltipText: '#F5EDE4',
    labelFill: '#B8A494',
  },
};

// ─── Nord (Blue-grey) ───────────────────────────────────────────────────────
const nordTokens: DarkThemeTokens = {
  background: { default: '#2E3440', paper: '#3B4252' },
  text: { primary: '#ECEFF4', secondary: '#D8DEE9' },
  primary: '#88C0D0',
  secondary: '#81A1C1',
  divider: 'rgba(136, 192, 208, 0.15)',
  cardBorder: 'rgba(136, 192, 208, 0.12)',
  cardShadow: '0 1px 4px rgba(46, 52, 64, 0.12)',
  sidebar: {
    bg: '#2E3440',
    activeText: '#ECEFF4',
    inactiveText: 'rgba(236, 239, 244, 0.7)',
    activeIcon: '#88C0D0',
    inactiveIcon: 'rgba(236, 239, 244, 0.7)',
    indicator: '#88C0D0',
    selectedBg: 'rgba(136, 192, 208, 0.18)',
    selectedHoverBg: 'rgba(136, 192, 208, 0.25)',
    hoverBg: 'rgba(136, 192, 208, 0.10)',
    brandBg: 'rgba(136, 192, 208, 0.22)',
    divider: 'rgba(136, 192, 208, 0.15)',
  },
  dataGrid: {
    headerBg: '#3B4252',
    headerText: '#ECEFF4',
    headerBorder: 'rgba(136, 192, 208, 0.18)',
    rowBg: '#434C5E',
    rowAltBg: '#4C566A',
    cellText: '#D8DEE9',
    cellBorder: 'rgba(136, 192, 208, 0.08)',
    hoverBg: 'rgba(136, 192, 208, 0.12)',
    outerBorder: 'rgba(136, 192, 208, 0.15)',
    footerBg: '#3B4252',
    footerInfoText: '#D8DEE9',
    footerIconColor: '#D8DEE9',
    toolbarBg: '#3B4252',
  },
  chart: {
    gridStroke: 'rgba(136, 192, 208, 0.12)',
    axisStroke: '#D8DEE9',
    tooltipBg: '#3B4252',
    tooltipBorder: 'rgba(136, 192, 208, 0.2)',
    tooltipText: '#ECEFF4',
    labelFill: '#D8DEE9',
  },
};

// ─── Azul (Electric Blue #2979FF) ───────────────────────────────────────────
const azulTokens: DarkThemeTokens = {
  background: { default: '#0A1628', paper: '#122035' },
  text: { primary: '#E2ECF8', secondary: '#8AABC8' },
  primary: '#2979FF',
  secondary: '#40C4FF',
  divider: 'rgba(41, 121, 255, 0.15)',
  cardBorder: 'rgba(41, 121, 255, 0.12)',
  cardShadow: '0 1px 4px rgba(10, 22, 40, 0.12)',
  sidebar: {
    bg: '#0A1628',
    activeText: '#E2ECF8',
    inactiveText: 'rgba(226, 236, 248, 0.7)',
    activeIcon: '#2979FF',
    inactiveIcon: 'rgba(226, 236, 248, 0.7)',
    indicator: '#2979FF',
    selectedBg: 'rgba(41, 121, 255, 0.18)',
    selectedHoverBg: 'rgba(41, 121, 255, 0.25)',
    hoverBg: 'rgba(41, 121, 255, 0.10)',
    brandBg: 'rgba(41, 121, 255, 0.22)',
    divider: 'rgba(41, 121, 255, 0.15)',
  },
  dataGrid: {
    headerBg: '#122035',
    headerText: '#E2ECF8',
    headerBorder: 'rgba(41, 121, 255, 0.18)',
    rowBg: '#152840',
    rowAltBg: '#1A304A',
    cellText: '#8AABC8',
    cellBorder: 'rgba(41, 121, 255, 0.08)',
    hoverBg: 'rgba(41, 121, 255, 0.12)',
    outerBorder: 'rgba(41, 121, 255, 0.15)',
    footerBg: '#122035',
    footerInfoText: '#8AABC8',
    footerIconColor: '#8AABC8',
    toolbarBg: '#122035',
  },
  chart: {
    gridStroke: 'rgba(41, 121, 255, 0.12)',
    axisStroke: '#8AABC8',
    tooltipBg: '#122035',
    tooltipBorder: 'rgba(41, 121, 255, 0.2)',
    tooltipText: '#E2ECF8',
    labelFill: '#8AABC8',
  },
};

// ─── Registry & helpers ─────────────────────────────────────────────────────

/** Temas que usam dark mode */
type DarkTema = 'escuro' | 'oceano' | 'sunset' | 'nord' | 'azul';

export const darkThemeRegistry: Record<DarkTema, DarkThemeTokens> = {
  escuro: escuroTokens,
  oceano: oceanoTokens,
  sunset: sunsetTokens,
  nord: nordTokens,
  azul: azulTokens,
};

/**
 * Retorna os tokens do dark theme. Retorna `null` para temas light (claro, pet).
 */
export function getThemeTokens(tema: SidebarTema): DarkThemeTokens | null {
  if (tema in darkThemeRegistry) return darkThemeRegistry[tema as DarkTema];
  return null;
}

/** Backward compat alias */
export const darkTokens = escuroTokens;
