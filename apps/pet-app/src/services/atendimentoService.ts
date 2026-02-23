import api from './api';
import type { ClinicalVisit, ClinicalVisitDto, MedicalProcedure, DocumentTracking, TimelineEntry, SearchRequest, PaginatedResponse } from '../types';

export const atendimentoService = {
  getById: async (id: string): Promise<ClinicalVisit> => {
    const response = await api.get(`/clinical-visits/${id}`);
    return response.data;
  },

  create: async (data: ClinicalVisitDto): Promise<ClinicalVisit> => {
    const response = await api.post('/clinical-visits', data);
    return response.data;
  },

  update: async (id: string, data: Partial<ClinicalVisitDto>): Promise<ClinicalVisit> => {
    const response = await api.put(`/clinical-visits/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/clinical-visits/${id}`);
  },

  search: async (searchRequest: SearchRequest = {}): Promise<PaginatedResponse<ClinicalVisit>> => {
    const defaultRequest: SearchRequest = {
      where: {},
      skip: 0,
      take: 10,
      sort: [{ field: 'startedAt', direction: 'DESC' }],
    };
    const request = { ...defaultRequest, ...searchRequest };
    const response = await api.post('/clinical-visits/search', request);
    return response.data;
  },

  // Lifecycle
  start: async (id: string): Promise<ClinicalVisit> => {
    const response = await api.patch(`/clinical-visits/${id}/start`);
    return response.data;
  },

  complete: async (id: string): Promise<ClinicalVisit> => {
    const response = await api.patch(`/clinical-visits/${id}/complete`);
    return response.data;
  },

  cancel: async (id: string): Promise<ClinicalVisit> => {
    const response = await api.patch(`/clinical-visits/${id}/cancel`);
    return response.data;
  },

  // Sub-resources
  getProcedures: async (id: string): Promise<MedicalProcedure[]> => {
    const response = await api.get(`/clinical-visits/${id}/procedures`);
    return Array.isArray(response.data) ? response.data : response.data?.data || [];
  },

  getDocuments: async (id: string): Promise<DocumentTracking[]> => {
    const response = await api.get(`/clinical-visits/${id}/documents`);
    return Array.isArray(response.data) ? response.data : response.data?.data || [];
  },

  getTimeline: async (id: string): Promise<TimelineEntry[]> => {
    const response = await api.get(`/clinical-visits/${id}/timeline`);
    return Array.isArray(response.data) ? response.data : response.data?.data || [];
  },

  // Queries
  getOpenByPet: async (petId: string): Promise<ClinicalVisit | null> => {
    try {
      const response = await api.post('/clinical-visits/search', {
        where: { petId, status: 'OPEN' },
        skip: 0,
        take: 1,
        sort: [{ field: 'startedAt', direction: 'DESC' }],
      });
      const data = response.data?.data;
      if (data && data.length > 0) return data[0];
      // Also check IN_PROGRESS
      const response2 = await api.post('/clinical-visits/search', {
        where: { petId, status: 'IN_PROGRESS' },
        skip: 0,
        take: 1,
        sort: [{ field: 'startedAt', direction: 'DESC' }],
      });
      const data2 = response2.data?.data;
      return data2 && data2.length > 0 ? data2[0] : null;
    } catch {
      return null;
    }
  },
};
