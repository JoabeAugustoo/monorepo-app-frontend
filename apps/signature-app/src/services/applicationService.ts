import api from './api';
import type { Application, ApplicationDTO, SearchRequest, PaginatedResponse, CountResponse } from '../types';

export const applicationService = {
  create: async (data: ApplicationDTO): Promise<Application> => {
    const response = await api.post<Application>('/api/applications', data);
    return response.data;
  },

  getById: async (id: string): Promise<Application> => {
    const response = await api.get<Application>(`/api/applications/${id}`);
    return response.data;
  },

  search: async (request: SearchRequest): Promise<PaginatedResponse<Application>> => {
    const response = await api.post<PaginatedResponse<Application>>('/api/applications/search', request);
    return response.data;
  },

  count: async (): Promise<CountResponse> => {
    const response = await api.get<CountResponse>('/api/applications/stats/count');
    return response.data;
  },

  findActive: async (): Promise<Application[]> => {
    const response = await api.get('/api/applications/active');
    const result = response.data;
    return Array.isArray(result) ? result : result?.data || [];
  },

  update: async (id: string, data: ApplicationDTO): Promise<Application> => {
    const response = await api.put<Application>(`/api/applications/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/applications/${id}`);
  },

  activate: async (id: string): Promise<Application> => {
    const response = await api.patch<Application>(`/api/applications/${id}/activate`);
    return response.data;
  },

  deactivate: async (id: string): Promise<Application> => {
    const response = await api.patch<Application>(`/api/applications/${id}/deactivate`);
    return response.data;
  },
};
