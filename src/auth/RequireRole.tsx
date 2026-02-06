import { Navigate } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import { useAuth } from './AuthContext';

interface RequireRoleProps {
  children: React.ReactNode;
  roles: string[];
  fallback?: 'redirect' | 'forbidden';
}

export function RequireRole({ children, roles, fallback = 'forbidden' }: RequireRoleProps) {
  const { hasAnyRole, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasAnyRole(roles)) {
    if (fallback === 'redirect') {
      return <Navigate to="/dashboard" replace />;
    }

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '60vh',
          gap: 2,
        }}
      >
        <BlockIcon sx={{ fontSize: 80, color: 'error.main' }} />
        <Typography variant="h4" color="error">
          Acesso Negado
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Você não tem permissão para acessar esta página.
        </Typography>
        <Button variant="contained" href="/dashboard">
          Voltar ao Dashboard
        </Button>
      </Box>
    );
  }

  return <>{children}</>;
}
