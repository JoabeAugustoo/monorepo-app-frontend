import type { AppRoute } from '@app/core';
import type { Permissions } from '../types';
import DashboardPage from '../pages/DashboardPage';
import UsersPage from '../pages/UsersPage';
import RolesPage from '../pages/RolesPage';
import ApplicationsPage from '../pages/ApplicationsPage';
import ApplicationDetailPage from '../pages/ApplicationDetailPage';
import ClientsPage from '../pages/ClientsPage';

export function getRoutes(permissions: Permissions): AppRoute[] {
  const routes: AppRoute[] = [];

  if (permissions.canReadDashboard) {
    routes.push({ path: '/', element: <DashboardPage />, index: true });
  }

  if (permissions.canReadUsers) {
    routes.push({ path: '/usuarios', element: <UsersPage /> });
  }

  if (permissions.canReadRoles) {
    routes.push({ path: '/roles', element: <RolesPage /> });
  }

  if (permissions.canReadApps) {
    routes.push({ path: '/aplicacoes', element: <ApplicationsPage /> });
    routes.push({ path: '/aplicacoes/:id', element: <ApplicationDetailPage /> });
  }

  if (permissions.canReadClients) {
    routes.push({ path: '/clients', element: <ClientsPage /> });
  }

  return routes;
}
