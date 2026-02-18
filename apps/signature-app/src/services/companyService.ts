import api from './api';
import type { Company, CompanyDTO, SearchRequest, PaginatedResponse, CountResponse } from '../types';

export const companyService = {
  create: async (data: CompanyDTO): Promise<Company> => {
    const response = await api.post<Company>('/api/companies', data);
    return response.data;
  },

  getById: async (id: string): Promise<Company> => {
    const response = await api.get<Company>(`/api/companies/${id}`);
    return response.data;
  },

  search: async (request: SearchRequest): Promise<PaginatedResponse<Company>> => {
    const response = await api.post<PaginatedResponse<Company>>('/api/companies/search', request);
    return response.data;
  },

  count: async (): Promise<CountResponse> => {
    const response = await api.get<CountResponse>('/api/companies/stats/count');
    return response.data;
  },

  findActive: async (): Promise<Company[]> => {
    const response = await api.get('/api/companies/active');
    const result = response.data;
    return Array.isArray(result) ? result : result?.data || [];
  },

  update: async (id: string, data: CompanyDTO): Promise<Company> => {
    const response = await api.put<Company>(`/api/companies/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/companies/${id}`);
  },

  activate: async (id: string): Promise<Company> => {
    const response = await api.patch<Company>(`/api/companies/${id}/activate`);
    return response.data;
  },

  deactivate: async (id: string): Promise<Company> => {
    const response = await api.patch<Company>(`/api/companies/${id}/deactivate`);
    return response.data;
  },
};
