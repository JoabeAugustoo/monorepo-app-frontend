import api from './api';
import type {
  Application,
  ApplicationDto,
  CountResponse,
  SearchRequest,
  PaginatedResponse,
} from '../types';

export const applicationService = {
  search: async (searchRequest: SearchRequest = {}): Promise<PaginatedResponse<Application>> => {
    const defaultRequest: SearchRequest = {
      where: {},
      skip: 0,
      take: 10,
      sort: [{ field: 'updatedAt', direction: 'DESC' }],
    };
    const request = { ...defaultRequest, ...searchRequest };
    const response = await api.post('/applications/search', request);
    return response.data;
  },

  getById: async (id: string): Promise<Application> => {
    const response = await api.get(`/applications/${id}`);
    return response.data;
  },

  create: async (data: ApplicationDto): Promise<Application> => {
    const response = await api.post('/applications', data);
    return response.data;
  },

  update: async (id: string, data: ApplicationDto): Promise<Application> => {
    const response = await api.put(`/applications/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/applications/${id}`);
  },

  getActive: async (): Promise<Application[]> => {
    const response = await api.get('/applications/active');
    return Array.isArray(response.data) ? response.data : response.data?.data || [];
  },

  getCount: async (): Promise<CountResponse> => {
    const response = await api.get('/applications/stats/count');
    return response.data;
  },

  activate: async (id: string): Promise<Application> => {
    const response = await api.patch(`/applications/${id}/activate`);
    return response.data;
  },

  deactivate: async (id: string): Promise<Application> => {
    const response = await api.patch(`/applications/${id}/deactivate`);
    return response.data;
  },
};
