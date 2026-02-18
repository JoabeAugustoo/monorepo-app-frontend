import api from './api';
import type {
  Document,
  DocumentDetail,
  DocumentTimelineResponse,
  SignWithCompanyRequest,
  SearchRequest,
  PaginatedResponse,
} from '../types';

export const documentService = {
  upload: async (companyPublicId: string, file: File, applicationPublicId?: string): Promise<Document> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('companyPublicId', companyPublicId);
    if (applicationPublicId) {
      formData.append('applicationPublicId', applicationPublicId);
    }
    const response = await api.post<Document>('/api/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getById: async (id: string): Promise<DocumentDetail> => {
    const response = await api.get<DocumentDetail>(`/api/documents/${id}`);
    return response.data;
  },

  search: async (request: SearchRequest): Promise<PaginatedResponse<Document>> => {
    const response = await api.post<PaginatedResponse<Document>>('/api/documents/search', request);
    return response.data;
  },

  signWithCompany: async (documentId: string, data: SignWithCompanyRequest): Promise<void> => {
    await api.post(`/api/documents/${documentId}/sign-company`, data);
  },

  download: async (id: string, version: 'original' | 'current' = 'original'): Promise<Blob> => {
    const response = await api.get(`/api/documents/${id}/download`, {
      params: { version },
      responseType: 'blob',
    });
    return response.data;
  },

  getTimeline: async (id: string): Promise<DocumentTimelineResponse> => {
    const response = await api.get<DocumentTimelineResponse>(`/api/documents/${id}/timeline`);
    return response.data;
  },
};
