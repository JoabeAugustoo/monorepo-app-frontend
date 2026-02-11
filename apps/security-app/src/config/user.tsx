import LogoutIcon from '@mui/icons-material/Logout';
import type { UserMenuConfig } from '@app/core';
import { authService } from '../services/authService';

export function createUserMenuConfig(navigate: (path: string) => void, logout?: () => void): UserMenuConfig {
  const user = authService.getCurrentUser();

  return {
    nomeUsuario: user?.name || user?.username || 'Usuario',
    items: [
      {
        label: 'Sair',
        icon: <LogoutIcon />,
        onClick: () => {
          authService.logout();
          logout?.();
          navigate('/login');
        },
      },
    ],
  };
}
