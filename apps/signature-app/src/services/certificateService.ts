import api from './api';
import type { Certificate, SearchRequest, PaginatedResponse, CountResponse } from '../types';

export const certificateService = {
  upload: async (companyPublicId: string, file: File, name: string, password: string): Promise<Certificate> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('companyPublicId', companyPublicId);
    formData.append('name', name);
    formData.append('password', password);
    const response = await api.post<Certificate>('/api/certificates/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getById: async (id: string): Promise<Certificate> => {
    const response = await api.get<Certificate>(`/api/certificates/${id}`);
    return response.data;
  },

  search: async (request: SearchRequest): Promise<PaginatedResponse<Certificate>> => {
    const response = await api.post<PaginatedResponse<Certificate>>('/api/certificates/search', request);
    return response.data;
  },

  count: async (): Promise<CountResponse> => {
    const response = await api.get<CountResponse>('/api/certificates/stats/count');
    return response.data;
  },

  findActive: async (): Promise<Certificate[]> => {
    const response = await api.get('/api/certificates/active');
    const result = response.data;
    return Array.isArray(result) ? result : result?.data || [];
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/certificates/${id}`);
  },

  activate: async (id: string): Promise<Certificate> => {
    const response = await api.patch<Certificate>(`/api/certificates/${id}/activate`);
    return response.data;
  },

  deactivate: async (id: string): Promise<Certificate> => {
    const response = await api.patch<Certificate>(`/api/certificates/${id}/deactivate`);
    return response.data;
  },
};
