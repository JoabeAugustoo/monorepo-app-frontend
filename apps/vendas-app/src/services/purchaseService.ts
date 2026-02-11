import api from './api';
import type { Purchase, SearchRequest, PaginatedResponse } from '../types';

export const purchaseService = {
  getPurchaseById: async (id: string): Promise<Purchase> => {
    const response = await api.get(`/purchases/${id}`);
    return response.data;
  },

  updatePurchase: async (id: string, purchaseData: Partial<Purchase>): Promise<Purchase> => {
    const response = await api.put(`/purchases/${id}`, purchaseData);
    return response.data;
  },

  deletePurchase: async (id: string): Promise<void> => {
    await api.delete(`/purchases/${id}`);
  },

  createPurchase: async (purchaseData: Partial<Purchase>): Promise<Purchase> => {
    const response = await api.post('/purchases', purchaseData);
    return response.data;
  },

  searchPurchases: async (searchRequest: SearchRequest = {}): Promise<PaginatedResponse<Purchase>> => {
    const defaultRequest: SearchRequest = {
      where: {},
      skip: 0,
      take: 10,
      sort: [{ field: 'createdAt', direction: 'DESC' }],
    };
    const request = { ...defaultRequest, ...searchRequest };
    const response = await api.post('/purchases/search', request);
    return response.data;
  },

  searchByProduct: async (productName: string): Promise<Purchase[]> => {
    const response = await api.get(`/purchases/search/by-product?productName=${encodeURIComponent(productName)}`);
    return response.data?.data || [];
  },

  searchByDateRange: async (startDate: string, endDate: string): Promise<Purchase[]> => {
    const response = await api.get(`/purchases/search/by-date-range?startDate=${startDate}&endDate=${endDate}`);
    return response.data?.data || [];
  },

  getTotalPurchasesByPeriod: async (startDate: string, endDate: string) => {
    const response = await api.get(`/purchases/dashboard/total?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  },

  getPurchaseDistribution: async (startDate: string, endDate: string) => {
    const response = await api.get(`/purchases/dashboard/distribution?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  },

  getCount: async () => {
    const response = await api.get('/purchases/stats/count');
    return response.data;
  },

  activatePurchase: async (id: string): Promise<Purchase> => {
    const response = await api.patch(`/purchases/${id}/activate`);
    return response.data;
  },

  deactivatePurchase: async (id: string): Promise<Purchase> => {
    const response = await api.patch(`/purchases/${id}/deactivate`);
    return response.data;
  },

  softDeletePurchase: async (id: string): Promise<Purchase> => {
    const response = await api.patch(`/purchases/${id}/deactivate`);
    return response.data;
  },

  getPurchasesByMonth: async (year: number, month: number): Promise<Purchase[]> => {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    const response = await api.get(`/purchases/search/by-date-range?startDate=${startDate}&endDate=${endDate}`);
    return response.data?.data || [];
  },

  getAllPurchases: async (): Promise<Purchase[]> => {
    const response = await api.post('/purchases/search', {
      where: {},
      skip: 0,
      take: 1000,
      sort: [{ field: 'createdAt', direction: 'DESC' }],
    });
    return response.data?.data || [];
  },
};
