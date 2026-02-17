import api from './api';
import type {
  Template,
  TemplateDto,
  TemplateVersion,
  CountResponse,
  SearchRequest,
  PaginatedResponse,
} from '../types';

export const templateService = {
  search: async (searchRequest: SearchRequest = {}): Promise<PaginatedResponse<Template>> => {
    const defaultRequest: SearchRequest = {
      where: {},
      skip: 0,
      take: 10,
      sort: [{ field: 'updatedAt', direction: 'DESC' }],
    };
    const request = { ...defaultRequest, ...searchRequest };
    const response = await api.post('/templates/search', request);
    return response.data;
  },

  getById: async (id: string): Promise<Template> => {
    const response = await api.get(`/templates/${id}`);
    return response.data;
  },

  create: async (data: TemplateDto): Promise<Template> => {
    const response = await api.post('/templates', data);
    return response.data;
  },

  update: async (id: string, data: TemplateDto): Promise<Template> => {
    const response = await api.put(`/templates/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/templates/${id}`);
  },

  getActive: async (): Promise<Template[]> => {
    const response = await api.get('/templates/active');
    return response.data;
  },

  getCount: async (): Promise<CountResponse> => {
    const response = await api.get('/templates/stats/count');
    return response.data;
  },

  activate: async (id: string): Promise<Template> => {
    const response = await api.patch(`/templates/${id}/activate`);
    return response.data;
  },

  deactivate: async (id: string): Promise<Template> => {
    const response = await api.patch(`/templates/${id}/deactivate`);
    return response.data;
  },

  getRaw: async (id: string): Promise<string> => {
    const response = await api.get(`/templates/${id}/raw`);
    return response.data;
  },

  // Versions
  getVersions: async (templateId: string): Promise<TemplateVersion[]> => {
    const response = await api.get(`/templates/${templateId}/versions`);
    return Array.isArray(response.data) ? response.data : response.data?.data || [];
  },

  getVersion: async (templateId: string, versionId: string): Promise<TemplateVersion> => {
    const response = await api.get(`/templates/${templateId}/versions/${versionId}`);
    return response.data;
  },

  uploadVersion: async (
    templateId: string,
    file: File,
    onProgress?: (pct: number) => void
  ): Promise<TemplateVersion> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/templates/${templateId}/versions/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(pct);
        }
      },
    });
    return response.data;
  },

  activateVersion: async (templateId: string, versionId: string): Promise<TemplateVersion> => {
    const response = await api.patch(`/templates/${templateId}/versions/${versionId}/activate`);
    return response.data;
  },
};
