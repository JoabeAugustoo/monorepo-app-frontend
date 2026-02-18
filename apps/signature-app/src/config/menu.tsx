import Dashboard from '@mui/icons-material/Dashboard';
import Business from '@mui/icons-material/Business';
import Badge from '@mui/icons-material/Badge';
import Description from '@mui/icons-material/Description';
import Apps from '@mui/icons-material/Apps';
import type { MenuItem } from '@app/core';

export function getMenuItems(): MenuItem[] {
  return [
    { label: 'Dashboard', icon: <Dashboard />, path: '/' },
    { label: 'Aplicacoes', icon: <Apps />, path: '/aplicacoes' },
    { label: 'Empresas', icon: <Business />, path: '/empresas' },
    { label: 'Certificados', icon: <Badge />, path: '/certificados' },
    { label: 'Documentos', icon: <Description />, path: '/documentos' },
  ];
}
