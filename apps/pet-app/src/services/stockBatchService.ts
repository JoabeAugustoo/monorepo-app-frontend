import api from './api';
import type { StockBatch, StockBatchDto, SearchRequest, PaginatedResponse } from '../types';

export const stockBatchService = {
  getById: async (id: string): Promise<StockBatch> => {
    const response = await api.get(`/stock-batches/${id}`);
    return response.data;
  },

  create: async (data: StockBatchDto): Promise<StockBatch> => {
    const response = await api.post('/stock-batches', data);
    return response.data;
  },

  update: async (id: string, data: Partial<StockBatchDto>): Promise<StockBatch> => {
    const response = await api.put(`/stock-batches/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/stock-batches/${id}`);
  },

  search: async (searchRequest: SearchRequest = {}): Promise<PaginatedResponse<StockBatch>> => {
    const defaultRequest: SearchRequest = {
      where: {},
      skip: 0,
      take: 10,
      sort: [{ field: 'createdAt', direction: 'DESC' }],
    };
    const request = { ...defaultRequest, ...searchRequest };
    const response = await api.post('/stock-batches/search', request);
    return response.data;
  },

  getExpiring: async (days: number = 30): Promise<StockBatch[]> => {
    const response = await api.get(`/stock-batches/expiring?days=${days}`);
    return Array.isArray(response.data) ? response.data : response.data?.data || [];
  },

  getCount: async () => {
    const response = await api.get('/stock-batches/stats/count');
    return response.data;
  },
};
