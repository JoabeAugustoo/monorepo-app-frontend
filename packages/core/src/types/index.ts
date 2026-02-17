import { ReactNode } from 'react';
import { ThemeOptions } from '@mui/material';
import { NavigateFunction } from 'react-router-dom';
import { NotificationConfig } from './notification';

export { NotificationType } from './notification';
export type { AppNotification, NotificationConfig } from './notification';

export interface MenuItem {
  label: string;
  icon: ReactNode;
  path: string;
}

export interface UserMenuItem {
  label: string;
  icon: ReactNode;
  onClick: () => void;
}

export interface UserMenuConfig {
  nomeUsuario: string;
  avatar?: string;
  items: UserMenuItem[];
}

export interface AppRoute {
  path: string;
  element: ReactNode;
  index?: boolean;
}

export type SidebarTema = 'claro' | 'escuro' | 'oceano' | 'sunset' | 'nord' | 'pet' | 'azul';

export type LoginMode = 'email' | 'username' | 'both';

export interface LoginCredenciais {
  identificador: string;
  senha: string;
  tipoIdentificador: 'email' | 'username';
}

export interface AuthUsuario {
  nomeUsuario: string;
  avatar?: string;
}

export interface AuthRespostaLogin {
  token: string;
  usuario: AuthUsuario;
}

export interface LoginPageConfig {
  mode: LoginMode;
  logo?: ReactNode;
  titulo?: string;
  subtitulo?: string;
  mostrarEsqueciSenha?: boolean;
  onEsqueciSenha?: () => void;
  onSubmit: (credenciais: LoginCredenciais) => Promise<AuthRespostaLogin>;
  onLogout?: () => void;
  textoBotao?: string;
  corFundo?: string;
}

export interface AppShellConfig {
  appName: string;
  appLogo?: ReactNode;
  menuItems: MenuItem[];
  userMenu: UserMenuConfig | ((navigate: NavigateFunction, logout?: () => void) => UserMenuConfig);
  routes: AppRoute[];
  themeOptions?: ThemeOptions;
  providers?: React.ComponentType<{ children: ReactNode }>[];
  loginPage?: LoginPageConfig;
  menuLayout?: 'vertical' | 'horizontal';
  appBarActions?: ReactNode;
  themeApiUrl?: string;
  notifications?: NotificationConfig;
}

// --- Generic types ---

export type CurrencyCode = 'BRL' | 'USD' | 'EUR';
export type Language = 'pt' | 'en' | 'es';

export interface TranslationSet {
  [key: string]: string | TranslationSet;
}

export interface SortField {
  field: string;
  direction: 'ASC' | 'DESC';
}

export interface SearchRequest {
  where?: Record<string, unknown>;
  skip?: number;
  take?: number;
  sort?: SortField[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
