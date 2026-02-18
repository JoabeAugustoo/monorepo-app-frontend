import api from './api';
import type { DocumentsByStatusResponse, DocumentsByApplicationResponse } from '../types';

interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  applicationPublicId?: string;
  companyPublicId?: string;
}

export const dashboardService = {
  getDocumentsByStatus: async (filters: DashboardFilters): Promise<DocumentsByStatusResponse> => {
    const params: Record<string, string> = {};
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.applicationPublicId) params.applicationPublicId = filters.applicationPublicId;
    if (filters.companyPublicId) params.companyPublicId = filters.companyPublicId;
    const response = await api.get<DocumentsByStatusResponse>('/api/api/dashboard/documents-by-status', { params });
    return response.data;
  },

  getDocumentsByApplication: async (filters: DashboardFilters): Promise<DocumentsByApplicationResponse> => {
    const params: Record<string, string> = {};
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.applicationPublicId) params.applicationPublicId = filters.applicationPublicId;
    if (filters.companyPublicId) params.companyPublicId = filters.companyPublicId;
    const response = await api.get<DocumentsByApplicationResponse>('/api/api/dashboard/documents-by-application', { params });
    return response.data;
  },
};
