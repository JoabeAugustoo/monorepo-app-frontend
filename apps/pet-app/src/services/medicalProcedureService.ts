import api from './api';
import type { MedicalProcedure, MedicalProcedureDto, CompleteProcedureDto, MedicalNoteDto, SearchRequest, PaginatedResponse } from '../types';

export const medicalProcedureService = {
  getById: async (id: string): Promise<MedicalProcedure> => {
    const response = await api.get(`/medical-procedures/${id}`);
    return response.data;
  },

  create: async (data: MedicalProcedureDto): Promise<MedicalProcedure> => {
    const response = await api.post('/medical-procedures', data);
    return response.data;
  },

  update: async (id: string, data: Partial<MedicalProcedureDto>): Promise<MedicalProcedure> => {
    const response = await api.put(`/medical-procedures/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/medical-procedures/${id}`);
  },

  search: async (searchRequest: SearchRequest = {}): Promise<PaginatedResponse<MedicalProcedure>> => {
    const defaultRequest: SearchRequest = {
      where: {},
      skip: 0,
      take: 10,
      sort: [{ field: 'date', direction: 'DESC' }],
    };
    const request = { ...defaultRequest, ...searchRequest };
    const response = await api.post('/medical-procedures/search', request);
    return response.data;
  },

  start: async (id: string): Promise<MedicalProcedure> => {
    const response = await api.patch(`/medical-procedures/${id}/start`);
    return response.data;
  },

  complete: async (id: string, data: CompleteProcedureDto): Promise<MedicalProcedure> => {
    const response = await api.patch(`/medical-procedures/${id}/complete`, data);
    return response.data;
  },

  cancel: async (id: string): Promise<MedicalProcedure> => {
    const response = await api.patch(`/medical-procedures/${id}/cancel`);
    return response.data;
  },

  addNote: async (id: string, data: MedicalNoteDto): Promise<MedicalProcedure> => {
    const response = await api.post(`/medical-procedures/${id}/notes`, data);
    return response.data;
  },

  getHistory: async (petId: string): Promise<MedicalProcedure[]> => {
    const response = await api.get(`/medical-procedures/pet/${petId}/history`);
    return Array.isArray(response.data) ? response.data : response.data?.data || [];
  },

  getCount: async () => {
    const response = await api.get('/medical-procedures/stats/count');
    return response.data;
  },
};
