import api from './api';
import type {
  GeneratedReport,
  ReportSearchRequest,
  PaginatedResponse,
} from '../types';

export const reportService = {
  search: async (searchRequest: ReportSearchRequest = {}): Promise<PaginatedResponse<GeneratedReport>> => {
    const request: ReportSearchRequest = {
      skip: 0,
      take: 10,
      ...searchRequest,
    };
    const response = await api.post('/reports/search', request);
    return response.data;
  },

  getById: async (id: string): Promise<GeneratedReport> => {
    const response = await api.get(`/reports/${id}`);
    return response.data;
  },

  download: async (id: string): Promise<void> => {
    const response = await api.get(`/reports/${id}/download`, {
      responseType: 'blob',
    });

    const contentDisposition = response.headers['content-disposition'];
    let fileName = `relatorio-${id}`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^";\n]+)"?/);
      if (match?.[1]) fileName = match[1];
    }

    const contentType = response.headers['content-type'] || 'application/octet-stream';
    const blob = new Blob([response.data], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
