import api from './api';
import type {
  TemplateCategory,
  TemplateCategoryDto,
  CountResponse,
  SearchRequest,
  PaginatedResponse,
} from '../types';

export const templateCategoryService = {
  search: async (searchRequest: SearchRequest = {}): Promise<PaginatedResponse<TemplateCategory>> => {
    const defaultRequest: SearchRequest = {
      where: {},
      skip: 0,
      take: 10,
      sort: [{ field: 'updatedAt', direction: 'DESC' }],
    };
    const request = { ...defaultRequest, ...searchRequest };
    const response = await api.post('/template-categories/search', request);
    return response.data;
  },

  getById: async (id: string): Promise<TemplateCategory> => {
    const response = await api.get(`/template-categories/${id}`);
    return response.data;
  },

  create: async (data: TemplateCategoryDto): Promise<TemplateCategory> => {
    const response = await api.post('/template-categories', data);
    return response.data;
  },

  update: async (id: string, data: TemplateCategoryDto): Promise<TemplateCategory> => {
    const response = await api.put(`/template-categories/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/template-categories/${id}`);
  },

  getActive: async (): Promise<TemplateCategory[]> => {
    const response = await api.get('/template-categories/active');
    return Array.isArray(response.data) ? response.data : response.data?.data || [];
  },

  getCount: async (): Promise<CountResponse> => {
    const response = await api.get('/template-categories/stats/count');
    return response.data;
  },

  activate: async (id: string): Promise<TemplateCategory> => {
    const response = await api.patch(`/template-categories/${id}/activate`);
    return response.data;
  },

  deactivate: async (id: string): Promise<TemplateCategory> => {
    const response = await api.patch(`/template-categories/${id}/deactivate`);
    return response.data;
  },

  getActiveByApplication: async (applicationId: string): Promise<TemplateCategory[]> => {
    const response = await api.get('/template-categories/by-application/active', {
      params: { applicationId },
    });
    return Array.isArray(response.data) ? response.data : response.data?.data || [];
  },
};
