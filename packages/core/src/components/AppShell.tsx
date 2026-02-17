import { ReactNode, useMemo } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router-dom';
import { createAppTheme } from '../theme/createAppTheme';
import { Layout } from './Layout';
import { LoginPage } from './LoginPage';
import { AppShellConfig } from '../types';
import { AuthContext, useAuth, useAuthState } from '../hooks/useAuth';
import { NotificationProvider } from '../contexts/NotificationContext';

interface AppShellProps {
  config: AppShellConfig;
}

function ComposeProviders({
  providers,
  children,
}: {
  providers: React.ComponentType<{ children: ReactNode }>[];
  children: ReactNode;
}) {
  return providers.reduceRight((acc, Provider) => {
    return <Provider>{acc}</Provider>;
  }, children);
}

function AuthLayout({ onLogout }: { onLogout?: () => void }) {
  const auth = useAuthState(onLogout);
  return (
    <AuthContext.Provider value={auth}>
      <Outlet />
    </AuthContext.Provider>
  );
}

function RotaProtegida({ children }: { children: ReactNode }) {
  const { carregando, autenticado } = useAuth();
  if (carregando) return null;
  if (!autenticado) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function AppShell({ config }: AppShellProps) {
  const theme = useMemo(() => createAppTheme(config.themeOptions), [config.themeOptions]);

  const router = useMemo(() => {
    if (config.loginPage) {
      return createBrowserRouter([
        {
          element: <AuthLayout onLogout={config.loginPage.onLogout} />,
          children: [
            {
              path: '/login',
              element: <LoginPage {...config.loginPage} appName={config.appName} />,
            },
            {
              path: '/',
              element: (
                <RotaProtegida>
                  <Layout
                    menuItems={config.menuItems}
                    userMenu={config.userMenu}
                    appName={config.appName}
                    appLogo={config.appLogo}
                    menuLayout={config.menuLayout}
                    appBarActions={config.appBarActions}
                    themeOptions={config.themeOptions}
                    themeApiUrl={config.themeApiUrl}
                    notifications={config.notifications}
                  />
                </RotaProtegida>
              ),
              children: [
                ...config.routes.map((route) => ({
                  path: route.index ? undefined : route.path,
                  index: route.index,
                  element: route.element,
                })),
                { path: '*', element: <Navigate to="/" replace /> },
              ],
            },
            { path: '*', element: <Navigate to="/" replace /> },
          ],
        },
      ]);
    }

    return createBrowserRouter([
      {
        path: '/',
        element: (
          <Layout
            menuItems={config.menuItems}
            userMenu={config.userMenu}
            appName={config.appName}
            appLogo={config.appLogo}
            menuLayout={config.menuLayout}
            themeOptions={config.themeOptions}
            themeApiUrl={config.themeApiUrl}
            notifications={config.notifications}
          />
        ),
        children: [
          ...config.routes.map((route) => ({
            path: route.index ? undefined : route.path,
            index: route.index,
            element: route.element,
          })),
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ]);
  }, [config.menuItems, config.userMenu, config.routes, config.appName, config.appLogo, config.loginPage, config.menuLayout, config.appBarActions, config.notifications]);

  const conteudo = <RouterProvider router={router} />;

  const allProviders = useMemo(() => {
    const providers = [...(config.providers || [])];
    if (config.notifications?.enabled) {
      const notifConfig = config.notifications;
      const WrappedNotificationProvider = ({ children }: { children: ReactNode }) => (
        <NotificationProvider config={notifConfig}>{children}</NotificationProvider>
      );
      providers.push(WrappedNotificationProvider);
    }
    return providers;
  }, [config.providers, config.notifications]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {allProviders.length > 0 ? (
        <ComposeProviders providers={allProviders}>{conteudo}</ComposeProviders>
      ) : (
        conteudo
      )}
    </ThemeProvider>
  );
}
