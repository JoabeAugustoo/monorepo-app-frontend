import { useMemo } from 'react';
import { AppShell } from '@app/core';
import { Toaster } from 'sonner';
import { I18nProvider } from './contexts/I18nContext';
import { RefreshProvider } from './contexts/RefreshContext';
import { QueryProvider } from './contexts/QueryContext';
import { getMenuItems } from './config/menu';
import { getRoutes } from './config/routes';
import { themeOptions } from './config/theme';
import { createUserMenuConfig } from './config/user';
import { usePermissions } from './hooks/usePermissions';
import { authService } from './services/authService';
import type { Permissions } from './types';
import './App.css';

const appLogo = <img src="/logo.svg" alt="Security" style={{ width: 34, height: 34, borderRadius: 6 }} />;

function AppContent() {
  const permissions = usePermissions();

  const menuItems = useMemo(
    () => getMenuItems(permissions),
    [permissions],
  );

  const routes = useMemo(
    () => getRoutes(permissions),
    [permissions],
  );

  return (
    <AppShell
      config={{
        appName: 'Security',
        appLogo,
        menuLayout: 'vertical',
        menuItems,
        routes,
        themeOptions,
        userMenu: (navigate, logout) => createUserMenuConfig(navigate, logout),
        providers: [QueryProvider, I18nProvider, RefreshProvider],
        loginPage: {
          mode: 'username',
          logo: <img src="/logo.svg" alt="Security" style={{ width: 64, height: 64 }} />,
          titulo: 'Security',
          subtitulo: 'Gerenciamento de Acesso e Seguranca',
          corFundo: '#3F51B5',
          onSubmit: async (credenciais) => {
            const { user: loggedUser, token } = await authService.login(
              credenciais.identificador,
              credenciais.senha,
            );
            return {
              token,
              usuario: { nomeUsuario: loggedUser.name || loggedUser.username },
            };
          },
          onLogout: () => authService.logout(),
        },
      }}
    />
  );
}

function StaticApp() {
  const defaultPermissions: Permissions = {
    canReadDashboard: true,
    canReadUsers: true,
    canWriteUsers: true,
    canReadRoles: true,
    canWriteRoles: true,
    canReadApps: true,
    canWriteApps: true,
    canReadClients: true,
    canWriteClients: true,
    canAccess: () => true,
    hasRole: () => true,
    isAdmin: () => true,
    userRoles: ['ADMIN'],
  };

  const menuItems = getMenuItems(defaultPermissions);
  const routes = getRoutes(defaultPermissions);

  return (
    <AppShell
      config={{
        appName: 'Security',
        appLogo,
        menuLayout: 'vertical',
        menuItems,
        routes,
        themeOptions,
        userMenu: (navigate, logout) => createUserMenuConfig(navigate, logout),
        providers: [QueryProvider, I18nProvider, RefreshProvider],
        loginPage: {
          mode: 'username',
          logo: <img src="/logo.svg" alt="Security" style={{ width: 64, height: 64 }} />,
          titulo: 'Security',
          subtitulo: 'Gerenciamento de Acesso e Seguranca',
          corFundo: '#3F51B5',
          onSubmit: async (credenciais) => {
            const { user: loggedUser, token } = await authService.login(
              credenciais.identificador,
              credenciais.senha,
            );
            return {
              token,
              usuario: { nomeUsuario: loggedUser.name || loggedUser.username },
            };
          },
          onLogout: () => authService.logout(),
        },
      }}
    />
  );
}

export default function App() {
  const user = authService.getCurrentUser();

  return (
    <>
      <Toaster richColors position="top-right" />
      {user ? <AppContent /> : <StaticApp />}
    </>
  );
}
