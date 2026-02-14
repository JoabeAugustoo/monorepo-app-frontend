import { AppRoute } from '@app/core';
import DashboardPage from '../pages/DashboardPage';
import TemplatesPage from '../pages/TemplatesPage';
import CreateTemplatePage from '../pages/CreateTemplatePage';
import TemplateDetailPage from '../pages/TemplateDetailPage';
import ReportsPage from '../pages/ReportsPage';

export const routes: AppRoute[] = [
  { path: '/', element: <DashboardPage />, index: true },
  { path: '/templates', element: <TemplatesPage /> },
  { path: '/templates/novo', element: <CreateTemplatePage /> },
  { path: '/templates/:id', element: <TemplateDetailPage /> },
  { path: '/relatorios', element: <ReportsPage /> },
];
