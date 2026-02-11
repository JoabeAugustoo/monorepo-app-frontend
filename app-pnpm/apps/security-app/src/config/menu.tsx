import Dashboard from '@mui/icons-material/Dashboard';
import People from '@mui/icons-material/People';
import Security from '@mui/icons-material/Security';
import Apps from '@mui/icons-material/Apps';
import Key from '@mui/icons-material/Key';
import type { MenuItem } from '@app/core';
import type { Permissions } from '../types';

export function getMenuItems(permissions: Permissions): MenuItem[] {
  const items: MenuItem[] = [];

  if (permissions.canReadDashboard) {
    items.push({ label: 'Dashboard', icon: <Dashboard />, path: '/' });
  }

  if (permissions.canReadApps) {
    items.push({ label: 'Aplicacoes', icon: <Apps />, path: '/aplicacoes' });
  }

  if (permissions.canReadUsers) {
    items.push({ label: 'Usuarios', icon: <People />, path: '/usuarios' });
  }

  if (permissions.canReadRoles) {
    items.push({ label: 'Roles', icon: <Security />, path: '/roles' });
  }

  if (permissions.canReadClients) {
    items.push({ label: 'Clients', icon: <Key />, path: '/clients' });
  }

  return items;
}
