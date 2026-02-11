import api from './api';
import type { Sale, SearchRequest, PaginatedResponse } from '../types';

export const salesService = {
  getEmployeeSummary: async (searchRequest: SearchRequest = {}) => {
    const defaultRequest: SearchRequest = { where: {}, skip: 0, take: 10 };
    const request = { ...defaultRequest, ...searchRequest };
    const response = await api.post('/sales/management/employee-summary', request);
    return response.data;
  },

  getSaleById: async (id: string): Promise<Sale> => {
    const response = await api.get(`/sales/${id}`);
    return response.data;
  },

  updateSale: async (id: string, saleData: Partial<Sale>): Promise<Sale> => {
    const response = await api.put(`/sales/${id}`, saleData);
    return response.data;
  },

  deleteSale: async (id: string): Promise<void> => {
    await api.delete(`/sales/${id}`);
  },

  createSale: async (saleData: Partial<Sale>): Promise<Sale> => {
    const response = await api.post('/sales', saleData);
    return response.data;
  },

  searchSales: async (searchRequest: SearchRequest = {}): Promise<PaginatedResponse<Sale>> => {
    const defaultRequest: SearchRequest = {
      where: {},
      skip: 0,
      take: 10,
      sort: [{ field: 'createdAt', direction: 'DESC' }],
    };
    const request = { ...defaultRequest, ...searchRequest };
    const response = await api.post('/sales/search', request);
    return response.data;
  },

  getSalesByClient: async (clientName: string): Promise<Sale[]> => {
    const response = await api.get(`/sales/search/by-client?clientName=${encodeURIComponent(clientName)}`);
    return response.data?.data || [];
  },

  getSalesByDateRange: async (startDate: string, endDate: string): Promise<Sale[]> => {
    const response = await api.get(`/sales/search/by-date-range?startDate=${startDate}&endDate=${endDate}`);
    return response.data?.data || [];
  },

  getNewClientSales: async (): Promise<Sale[]> => {
    const response = await api.get('/sales/search/new-clients');
    return response.data?.data || [];
  },

  getTotalSalesByPeriod: async (startDate: string, endDate: string) => {
    const response = await api.get(`/sales/dashboard/total?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  },

  getNewClientsByPeriod: async (startDate: string, endDate: string) => {
    const response = await api.get(`/sales/dashboard/new-clients?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  },

  getDailySalesByPeriod: async (startDate: string, endDate: string) => {
    const response = await api.get(`/sales/dashboard/daily?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  },

  getEmployeePerformanceByPeriod: async (startDate: string, endDate: string) => {
    const response = await api.get(`/sales/dashboard/employee-performance?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  },

  getCount: async () => {
    const response = await api.get('/sales/stats/count');
    return response.data;
  },

  activateSale: async (id: string): Promise<Sale> => {
    const response = await api.patch(`/sales/${id}/activate`);
    return response.data;
  },

  deactivateSale: async (id: string): Promise<Sale> => {
    const response = await api.patch(`/sales/${id}/deactivate`);
    return response.data;
  },

  softDeleteSale: async (id: string): Promise<Sale> => {
    const response = await api.patch(`/sales/${id}/deactivate`);
    return response.data;
  },

  getSalesStats: async (date: string) => {
    const nextDate = new Date(date + 'T00:00:00.000Z');
    nextDate.setDate(nextDate.getDate() + 1);
    const startDate = date;
    const endDate = nextDate.toISOString().split('T')[0];

    const [totalRes, newClientsRes] = await Promise.all([
      api.get(`/sales/dashboard/total?startDate=${startDate}&endDate=${endDate}`).catch(() => ({ data: 0 })),
      api.get(`/sales/dashboard/new-clients?startDate=${startDate}&endDate=${endDate}`).catch(() => ({ data: 0 })),
    ]);

    const extractValue = (data: unknown): number => {
      if (typeof data === 'object' && data !== null) {
        const obj = data as Record<string, number>;
        return obj.total ?? obj.count ?? obj.value ?? 0;
      }
      return Number(data) || 0;
    };

    return {
      totalAmount: extractValue(totalRes.data),
      totalNewClients: extractValue(newClientsRes.data),
      totalAttendances: 0,
    };
  },

  getSalesByMonth: async (year: number, month: number): Promise<Sale[]> => {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    const response = await api.get(`/sales/search/by-date-range?startDate=${startDate}&endDate=${endDate}`);
    return response.data?.data || [];
  },

  searchSalesByEmployee: async (
    employeePublicId: string,
    year: number,
    month: number,
    searchRequest: SearchRequest = {}
  ): Promise<PaginatedResponse<Sale>> => {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

    const defaultRequest: SearchRequest = {
      where: {},
      skip: 0,
      take: 10,
      sort: [{ field: 'date', direction: 'DESC' }],
    };

    const request = { ...defaultRequest, ...searchRequest };
    request.where = {
      ...request.where,
      employeePublicId,
      date: {
        gte: new Date(startDate + 'T00:00:00.000Z').toISOString(),
        lt: new Date(endDate + 'T00:00:00.000Z').toISOString(),
      },
    };

    const response = await api.post('/sales/search', request);
    return response.data;
  },

  getAllSales: async (): Promise<Sale[]> => {
    const response = await api.post('/sales/search', {
      where: {},
      skip: 0,
      take: 1000,
      sort: [{ field: 'createdAt', direction: 'DESC' }],
    });
    return response.data?.data || [];
  },
};
