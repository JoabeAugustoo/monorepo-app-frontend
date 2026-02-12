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
        menuLayout: 'vertical',
        loginPage: {
          mode: 'username',
          logo: (
            <svg width="72" height="72" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="142" cy="108" rx="52" ry="62" fill="#9C72D9" />
              <ellipse cx="142" cy="108" rx="36" ry="46" fill="#B99AE6" />
              <ellipse cx="370" cy="108" rx="52" ry="62" fill="#9C72D9" />
              <ellipse cx="370" cy="108" rx="36" ry="46" fill="#B99AE6" />
              <ellipse cx="68" cy="240" rx="48" ry="58" fill="#9C72D9" />
              <ellipse cx="68" cy="240" rx="33" ry="42" fill="#B99AE6" />
              <ellipse cx="444" cy="240" rx="48" ry="58" fill="#9C72D9" />
              <ellipse cx="444" cy="240" rx="33" ry="42" fill="#B99AE6" />
              <path d="M256 216c-80 0-144 56-144 130 0 60 40 110 80 130 20 10 40 16 64 16s44-6 64-16c40-20 80-70 80-130 0-74-64-130-144-130z" fill="#9C72D9" />
              <path d="M256 240c-62 0-112 42-112 102 0 48 30 86 62 102 16 8 32 12 50 12s34-4 50-12c32-16 62-54 62-102 0-60-50-102-112-102z" fill="#B99AE6" />
            </svg>
          ),
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
