import api from './api';
import type { Medication, MedicationDto, SearchRequest, PaginatedResponse } from '../types';

export const medicationService = {
  getById: async (id: string): Promise<Medication> => {
    const response = await api.get(`/medications/${id}`);
    return response.data;
  },

  create: async (data: MedicationDto): Promise<Medication> => {
    const response = await api.post('/medications', data);
    return response.data;
  },

  update: async (id: string, data: Partial<MedicationDto>): Promise<Medication> => {
    const response = await api.put(`/medications/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/medications/${id}`);
  },

  search: async (searchRequest: SearchRequest = {}): Promise<PaginatedResponse<Medication>> => {
    const defaultRequest: SearchRequest = {
      where: {},
      skip: 0,
      take: 10,
      sort: [{ field: 'createdAt', direction: 'DESC' }],
    };
    const request = { ...defaultRequest, ...searchRequest };
    const response = await api.post('/medications/search', request);
    return response.data;
  },

  getLowStock: async (): Promise<Medication[]> => {
    const response = await api.get('/medications/low-stock');
    return Array.isArray(response.data) ? response.data : response.data?.data || [];
  },

  getActive: async (): Promise<Medication[]> => {
    const response = await api.get('/medications/active');
    return Array.isArray(response.data) ? response.data : response.data?.data || [];
  },

  getCount: async () => {
    const response = await api.get('/medications/stats/count');
    return response.data;
  },
};
