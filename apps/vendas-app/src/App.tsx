import { useMemo, useCallback, useState, useEffect } from 'react';
import { AppShell } from '@app/core';
import { MuiDatePicker } from '@app/ui';
import { Toaster } from 'sonner';
import { I18nProvider } from './contexts/I18nContext';
import { RefreshProvider } from './contexts/RefreshContext';
import { DateProvider, useDate } from './contexts/DateContext';
import { getMenuItems } from './config/menu';
import { getRoutes } from './config/routes';
import { themeOptions } from './config/theme';
import { createUserMenuConfig } from './config/user';
import { usePermissions } from './hooks/usePermissions';
import { authService } from './services/authService';
import './App.css';

const appLogo = <img src="/logo.svg" alt="Venda Max" style={{ width: 34, height: 34, borderRadius: 6 }} />;

function DatePickerAction() {
  const { selectedYear, selectedMonth, setDate } = useDate();

  const value = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

  const handleChange = useCallback((val: string) => {
    const [y, m] = val.split('-').map(Number);
    if (y && m) setDate(y, m);
  }, [setDate]);

  return (
    <MuiDatePicker
      value={value}
      onChange={handleChange}
      mode="month"
      placeholder="Mês/Ano"
      sx={{ width: 160 }}
    />
  );
}

function AppContent() {
  const permissions = usePermissions();
  const user = authService.getCurrentUser();
  const isEmployee = user?.isEmployee ?? false;

  const menuItems = useMemo(
    () => getMenuItems(permissions, isEmployee),
    [permissions, isEmployee]
  );

  const routes = useMemo(
    () => getRoutes(permissions, isEmployee),
    [permissions, isEmployee]
  );

  return (
    <AppShell
      config={{
        appName: 'Venda Max',
        appLogo,
        menuLayout: 'horizontal',
        appBarActions: <DatePickerAction />,
        menuItems,
        routes,
        themeOptions,
        userMenu: (navigate, logout) => createUserMenuConfig(navigate, logout),
        providers: [I18nProvider, RefreshProvider, DateProvider],
        loginPage: {
          mode: 'username',
          logo: <img src="/logo.svg" alt="Venda Max" style={{ width: 64, height: 64 }} />,
          titulo: 'Venda Max',
          subtitulo: 'Sistema de Gestão de Vendas',
          corFundo: '#7B1FA2',
          onSubmit: async (credenciais) => {
            const { user: loggedUser, token } = await authService.login(
              credenciais.identificador,
              credenciais.senha
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
  const [authKey, setAuthKey] = useState(() => authService.getCurrentUser()?.id || 'anon');

  useEffect(() => {
    const handleAuthChange = () => {
      const user = authService.getCurrentUser();
      setAuthKey(user?.id || 'anon');
    };
    window.addEventListener('vendas-auth-change', handleAuthChange);
    return () => window.removeEventListener('vendas-auth-change', handleAuthChange);
  }, []);

  return (
    <>
      <Toaster richColors position="top-right" />
      <AppContent key={authKey} />
    </>
  );
}
