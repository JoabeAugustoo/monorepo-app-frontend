import { useMemo, type ReactNode } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { createAppTheme, AuthContext, useAuthState, useAuth, Layout, LoginPage } from '@app/core';
import { I18nProvider } from './contexts/I18nContext';
import { RefreshProvider } from './contexts/RefreshContext';
import { QueryProvider } from './contexts/QueryContext';
import { getMenuItems } from './config/menu';
import { getRoutes } from './config/routes';
import { themeOptions } from './config/theme';
import { createUserMenuConfig } from './config/user';
import { authService } from './services/authService';
import SigningPage from './pages/public/SigningPage';
import VerifyPage from './pages/public/VerifyPage';

const appLogo = <img src="/logo.svg" alt="Signature" style={{ width: 34, height: 34, borderRadius: 6 }} />;

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

function AuthLayout() {
  const auth = useAuthState(() => authService.logout());
  return (
    <AuthContext.Provider value={auth}>
      <Outlet />
    </AuthContext.Provider>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { carregando, autenticado } = useAuth();
  if (carregando) return null;
  if (!autenticado) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const theme = useMemo(() => createAppTheme(themeOptions), []);
  const menuItems = useMemo(() => getMenuItems(), []);
  const routes = useMemo(() => getRoutes(), []);

  const router = useMemo(
    () =>
      createBrowserRouter([
        // PUBLIC routes (no auth, no Layout)
        { path: '/sign/:token', element: <SigningPage /> },
        { path: '/verify/:documentId', element: <VerifyPage /> },

        // AUTHENTICATED routes
        {
          element: <AuthLayout />,
          children: [
            {
              path: '/login',
              element: (
                <LoginPage
                  mode="username"
                  logo={<img src="/logo.svg" alt="Signature" style={{ width: 64, height: 64 }} />}
                  titulo="Signature"
                  subtitulo="Assinatura Digital de Documentos"
                  corFundo="#0d9488"
                  onSubmit={async (credenciais) => {
                    const { user, token } = await authService.login(
                      credenciais.identificador,
                      credenciais.senha,
                    );
                    return {
                      token,
                      usuario: { nomeUsuario: user.name || user.username },
                    };
                  }}
                  onLogout={() => authService.logout()}
                  appName="Signature"
                />
              ),
            },
            {
              path: '/',
              element: (
                <ProtectedRoute>
                  <Layout
                    menuItems={menuItems}
                    userMenu={(navigate, logout) => createUserMenuConfig(navigate, logout)}
                    appName="Signature"
                    appLogo={appLogo}
                    menuLayout="vertical"
                    themeOptions={themeOptions}
                    themeApiUrl={`${import.meta.env.VITE_API_URL || 'http://localhost:8088'}/api/auth/theme`}
                  />
                </ProtectedRoute>
              ),
              children: [
                ...routes.map((route) => ({
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
      ]),
    [menuItems, routes],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ComposeProviders providers={[QueryProvider, I18nProvider, RefreshProvider]}>
        <Toaster richColors position="top-right" />
        <RouterProvider router={router} />
      </ComposeProviders>
    </ThemeProvider>
  );
}
