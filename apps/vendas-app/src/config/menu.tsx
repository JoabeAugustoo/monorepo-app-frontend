import Dashboard from '@mui/icons-material/Dashboard';
import ShoppingCart from '@mui/icons-material/ShoppingCart';
import Inventory from '@mui/icons-material/Inventory';
import PointOfSale from '@mui/icons-material/PointOfSale';
import People from '@mui/icons-material/People';
import Assessment from '@mui/icons-material/Assessment';
import Storefront from '@mui/icons-material/Storefront';
import type { MenuItem } from '@app/core';
import type { Permissions } from '../types';

export function getMenuItems(permissions: Permissions, isEmployee: boolean): MenuItem[] {
  const items: MenuItem[] = [];

  if (permissions.canReadDashboard) {
    items.push({ label: 'Dashboard', icon: <Dashboard />, path: '/' });
  }

  if (permissions.canReadProducts) {
    items.push({ label: 'Produtos', icon: <Inventory />, path: '/produtos' });
  }

  if (permissions.canReadPurchases) {
    items.push({ label: 'Compras', icon: <ShoppingCart />, path: '/compras' });
  }

  if (isEmployee && permissions.canReadSales) {
    items.push({ label: 'Minhas Vendas', icon: <PointOfSale />, path: '/vendas' });
  }

  if (!isEmployee && permissions.canReadSales) {
    items.push({ label: 'Gerência de Vendas', icon: <Storefront />, path: '/vendas-gerente' });
  }

  if (permissions.canReadEmployees) {
    items.push({ label: 'Funcionários', icon: <People />, path: '/funcionarios' });
  }

  if (permissions.canReadDashboard) {
    items.push({ label: 'Fechamento', icon: <Assessment />, path: '/fechamento' });
  }

  return items;
}
