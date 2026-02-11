import { Navigate } from 'react-router-dom';
import type { AppRoute } from '@app/core';
import type { Permissions } from '../types';
import DashboardPage from '../pages/DashboardPage';
import ProductsPage from '../pages/ProductsPage';
import PurchasesPage from '../pages/PurchasesPage';
import SalesPage from '../pages/SalesPage';
import ManagerSalesPage from '../pages/ManagerSalesPage';
import EmployeesPage from '../pages/EmployeesPage';
import MonthlyReportPage from '../pages/MonthlyReportPage';

export function getRoutes(permissions: Permissions, isEmployee: boolean): AppRoute[] {
  const routes: AppRoute[] = [];

  if (permissions.canReadDashboard) {
    routes.push({ path: '/', element: <DashboardPage />, index: true });
  }

  if (permissions.canReadProducts) {
    routes.push({ path: '/produtos', element: <ProductsPage /> });
  }

  if (permissions.canReadPurchases) {
    routes.push({ path: '/compras', element: <PurchasesPage /> });
  }

  // SalesPage acessivel por todos com permissao
  if (permissions.canReadSales) {
    routes.push({ path: '/vendas', element: <SalesPage /> });
  }

  // ManagerSalesPage so para manager
  if (!isEmployee && permissions.canReadSales) {
    routes.push({ path: '/vendas-gerente', element: <ManagerSalesPage /> });
  }

  if (permissions.canReadEmployees) {
    routes.push({ path: '/funcionarios', element: <EmployeesPage /> });
  }

  if (permissions.canReadDashboard) {
    routes.push({ path: '/fechamento', element: <MonthlyReportPage /> });
  }

  // Se nao tem rota index, redireciona para a primeira rota disponivel
  if (!routes.some((r) => r.index)) {
    const firstRoute = routes[0];
    if (firstRoute) {
      routes.push({ path: '/', element: <Navigate to={firstRoute.path} replace />, index: true });
    }
  }

  return routes;
}
