import type { AppRoute } from '@app/core';
import DashboardPage from '../pages/DashboardPage';
import CompaniesPage from '../pages/CompaniesPage';
import CertificatesPage from '../pages/CertificatesPage';
import DocumentsPage from '../pages/DocumentsPage';
import DocumentDetailPage from '../pages/DocumentDetailPage';
import ApplicationsPage from '../pages/ApplicationsPage';

export function getRoutes(): AppRoute[] {
  return [
    { path: '/', element: <DashboardPage />, index: true },
    { path: '/aplicacoes', element: <ApplicationsPage /> },
    { path: '/empresas', element: <CompaniesPage /> },
    { path: '/certificados', element: <CertificatesPage /> },
    { path: '/documentos', element: <DocumentsPage /> },
    { path: '/documentos/:id', element: <DocumentDetailPage /> },
  ];
}
