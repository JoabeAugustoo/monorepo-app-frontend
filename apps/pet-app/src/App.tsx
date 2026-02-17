import { useState, useEffect } from 'react';
import { AppShell } from '@app/core';
import { Toaster } from 'sonner';
import { menuItems } from './config/menu';
import { routes } from './config/routes';
import { themeOptions } from './config/theme';
import { createUserMenuConfig } from './config/user';
import { authService } from './services/authService';

const PET_API_URL = import.meta.env.VITE_PET_API_URL || 'http://localhost:8084/api';
const NOTIFICATION_URL = import.meta.env.VITE_PET_NOTIFICATION_URL || 'http://localhost:8087';

function AppContent() {
  return (
    <AppShell
      config={{
        appName: 'PetManager',
        menuItems,
        routes,
        themeOptions,
        userMenu: (navigate, logout) => createUserMenuConfig(navigate, logout),
        themeApiUrl: `${import.meta.env.VITE_PET_AUTH_URL || 'http://localhost:8084'}/api/auth/theme`,
        menuLayout: 'vertical',
        notifications: {
          enabled: true,
          notificationUrl: NOTIFICATION_URL,
          getAuthToken: () => localStorage.getItem('pet-auth-token'),
          onNotificationClick: (notification, navigate) => {
            const meta = notification.metadata;
            if (meta?.route) {
              navigate(meta.route as string, meta.routeState ? { state: meta.routeState } : undefined);
            }
          },
        },
        loginPage: {
          mode: 'username',
          logo: <img src="/logo.svg" alt="PetManager" style={{ width: 72, height: 72 }} />,
          subtitulo: 'Gerencie seus pets com facilidade',
          corFundo: '#9C72D9',
          onSubmit: async (credenciais) => {
            const { user, token } = await authService.login(
              credenciais.identificador,
              credenciais.senha
            );
            return {
              token,
              usuario: { nomeUsuario: user.name || user.username },
            };
          },
          onLogout: () => authService.logout(),
        },
      }}
    />
  );
}

export default function App() {
  const [authKey, setAuthKey] = useState(() => authService.getCurrentUser()?.id || 'anon');

  useEffect(() => {
    const handleAuthChange = () => {
      const user = authService.getCurrentUser();
      setAuthKey(user?.id || 'anon');
    };
    window.addEventListener('pet-auth-change', handleAuthChange);
    return () => window.removeEventListener('pet-auth-change', handleAuthChange);
  }, []);

  return (
    <>
      <Toaster richColors position="top-right" />
      <AppContent key={authKey} />
    </>
  );
}
