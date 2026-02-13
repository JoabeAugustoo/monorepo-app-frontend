import { useState, useEffect } from 'react';
import { AppShell } from '@app/core';
import { Toaster } from 'sonner';
import { menuItems } from './config/menu';
import { routes } from './config/routes';
import { themeOptions } from './config/theme';
import { createUserMenuConfig } from './config/user';
import { authService } from './services/authService';

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
