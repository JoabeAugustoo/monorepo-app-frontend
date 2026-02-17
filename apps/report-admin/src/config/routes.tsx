import { AppRoute } from '@app/core';
import DashboardPage from '../pages/DashboardPage';
import ApplicationsPage from '../pages/ApplicationsPage';
import TemplatesPage from '../pages/TemplatesPage';
import CreateTemplatePage from '../pages/CreateTemplatePage';
import TemplateDetailPage from '../pages/TemplateDetailPage';
import TemplateCategoriesPage from '../pages/TemplateCategoriesPage';
import ReportsPage from '../pages/ReportsPage';

export const routes: AppRoute[] = [
  { path: '/', element: <DashboardPage />, index: true },
  { path: '/aplicacoes', element: <ApplicationsPage /> },
  { path: '/templates', element: <TemplatesPage /> },
  { path: '/templates/novo', element: <CreateTemplatePage /> },
  { path: '/templates/:id', element: <TemplateDetailPage /> },
  { path: '/categorias', element: <TemplateCategoriesPage /> },
  { path: '/relatorios', element: <ReportsPage /> },
];
