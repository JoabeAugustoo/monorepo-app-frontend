import Dashboard from '@mui/icons-material/Dashboard';
import Pets from '@mui/icons-material/Pets';
import Settings from '@mui/icons-material/Settings';
import Widgets from '@mui/icons-material/Widgets';
import { MenuItem } from '@app/core';

export const menuItems: MenuItem[] = [
  { label: 'Painel', icon: <Dashboard />, path: '/' },
  { label: 'Pets', icon: <Pets />, path: '/pets' },
  { label: 'Configuracoes', icon: <Settings />, path: '/configuracoes' },
  { label: 'Componentes', icon: <Widgets />, path: '/componentes' },
];
