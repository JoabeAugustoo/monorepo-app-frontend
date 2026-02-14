import Dashboard from '@mui/icons-material/Dashboard';
import Description from '@mui/icons-material/Description';
import Assessment from '@mui/icons-material/Assessment';
import { MenuItem } from '@app/core';

export const menuItems: MenuItem[] = [
  { label: 'Dashboard', icon: <Dashboard />, path: '/' },
  { label: 'Templates', icon: <Description />, path: '/templates' },
  { label: 'Relatórios', icon: <Assessment />, path: '/relatorios' },
];
