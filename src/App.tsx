import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Toaster } from 'sonner';
import { theme } from './theme';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { RequireRole } from './auth/RequireRole';
import { AppLayout } from './layouts/AppLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { UsersPage } from './pages/Users';
import { RolesPage } from './pages/Roles';
import { ApplicationsPage } from './pages/Applications';
import { ApplicationDetails } from './pages/Applications/ApplicationDetails';
import { ClientsPage } from './pages/Clients';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
});

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />

        <Route
          path="users"
          element={
            <RequireRole roles={['ADMIN', 'ROLE_ADMIN']}>
              <UsersPage />
            </RequireRole>
          }
        />

        <Route
          path="roles"
          element={
            <RequireRole roles={['ADMIN', 'ROLE_ADMIN']}>
              <RolesPage />
            </RequireRole>
          }
        />


        <Route
          path="applications"
          element={
            <RequireRole roles={['ADMIN', 'ROLE_ADMIN']}>
              <ApplicationsPage />
            </RequireRole>
          }
        />

        <Route
          path="applications/:id"
          element={
            <RequireRole roles={['ADMIN', 'ROLE_ADMIN']}>
              <ApplicationDetails />
            </RequireRole>
          }
        />

        <Route
          path="clients"
          element={
            <RequireRole roles={['ADMIN', 'ROLE_ADMIN']}>
              <ClientsPage />
            </RequireRole>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            duration: 4000,
          }}
        />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
