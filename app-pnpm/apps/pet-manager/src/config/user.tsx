import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { UserMenuConfig } from '@app/core';

export function createUserMenuConfig(navigate: (path: string) => void, logout?: () => void): UserMenuConfig {
  return {
    nomeUsuario: 'Joabe',
    items: [
      {
        label: 'Configuracoes',
        icon: <SettingsIcon />,
        onClick: () => navigate('/configuracoes'),
      },
      {
        label: 'Sair',
        icon: <LogoutIcon />,
        onClick: () => {
          logout?.();
          navigate('/login');
        },
      },
    ],
  };
}
