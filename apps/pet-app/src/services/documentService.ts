import api from './api';
import type { DocumentTemplate, DocumentRecord, SendDocumentDto, SignDocumentDto, ReportStatusResponse, DocumentSearchRequest, DocumentSearchResponse, TemplateSearchRequest, TemplateSearchResponse, TemplateCategory } from '../types';

export const documentService = {
  getTemplates: async (): Promise<DocumentTemplate[]> => {
    const response = await api.get('/templates/active');
    return response.data;
  },

  getCategories: async (): Promise<TemplateCategory[]> => {
    const response = await api.get('/template-categories');
    return response.data;
  },

  searchTemplates: async (request: TemplateSearchRequest = {}): Promise<TemplateSearchResponse> => {
    const response = await api.post('/templates/search', {
      skip: 0,
      take: 10,
      ...request,
    });
    return response.data;
  },

  searchDocuments: async (request: DocumentSearchRequest): Promise<DocumentSearchResponse> => {
    const response = await api.post('/documents/search', request);
    return response.data;
  },

  getTemplateById: async (id: string): Promise<DocumentTemplate> => {
    const response = await api.get(`/templates/${id}`);
    return response.data;
  },

  getTemplateRaw: async (id: string): Promise<string> => {
    const response = await api.get(`/templates/${id}/raw`, {
      responseType: 'text',
    });
    return response.data;
  },

  sendDocument: async (dto: SendDocumentDto): Promise<DocumentRecord> => {
    const response = await api.post('/documents/send', dto);
    return response.data;
  },

  reprocessDocument: async (documentId: string): Promise<DocumentRecord> => {
    const response = await api.post(`/documents/${documentId}/reprocess`);
    return response.data;
  },

  getDocumentsByCustomerAndPet: async (
    customerId: string,
    petId: string,
  ): Promise<DocumentRecord[]> => {
    const response = await api.get('/documents/by-customer-pet', {
      params: { customerId, petId },
    });
    return response.data;
  },

  getDocumentById: async (id: string): Promise<DocumentRecord> => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },

  downloadDocument: async (id: string): Promise<Blob> => {
    const response = await api.get(`/documents/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  signDocument: async (id: string, dto: SignDocumentDto): Promise<DocumentRecord> => {
    const response = await api.post(`/documents/${id}/sign`, dto);
    return response.data;
  },

  getSignatureStatus: async (id: string): Promise<unknown> => {
    const response = await api.get(`/documents/${id}/signature-status`);
    return response.data;
  },

  // --- Report generation ---

  getReportStatus: async (reportId: string): Promise<ReportStatusResponse> => {
    const response = await api.get(`/reports/${reportId}`);
    return response.data;
  },

  downloadReport: async (reportId: string): Promise<Blob> => {
    const response = await api.get(`/reports/${reportId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  pollReportUntilDone: async (
    reportId: string,
    intervalMs = 2000,
    maxAttempts = 30,
  ): Promise<ReportStatusResponse> => {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await documentService.getReportStatus(reportId);
      if (status.status === 'COMPLETED' || status.status === 'FAILED') {
        return status;
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    throw new Error('Tempo limite excedido aguardando geração do relatório.');
  },
};
