import api from './api';
import type { Stock, StockMovement, SearchRequest, PaginatedResponse } from '../types';

export const stockService = {
  getStockById: async (id: string): Promise<Stock> => {
    const response = await api.get(`/stocks/${id}`);
    return response.data;
  },

  createStock: async (stockData: Partial<Stock>): Promise<Stock> => {
    const response = await api.post('/stocks', stockData);
    return response.data;
  },

  updateStock: async (id: string, stockData: Partial<Stock>): Promise<Stock> => {
    const response = await api.put(`/stocks/${id}`, stockData);
    return response.data;
  },

  deleteStock: async (id: string): Promise<void> => {
    await api.delete(`/stocks/${id}`);
  },

  getStockByProduct: async (productPublicId: string): Promise<Stock> => {
    const response = await api.get(`/stocks/product/${productPublicId}`);
    return response.data;
  },

  getLowStockProducts: async (threshold = 10) => {
    const response = await api.get(`/stocks/low-stock?threshold=${threshold}`);
    return response.data;
  },

  getOutOfStockProducts: async () => {
    const response = await api.get('/stocks/out-of-stock');
    return response.data;
  },

  searchByProductName: async (productName: string): Promise<Stock[]> => {
    const response = await api.get(`/stocks/search/by-product-name?productName=${encodeURIComponent(productName)}`);
    return response.data?.data || [];
  },

  searchStocks: async (searchRequest: SearchRequest = {}): Promise<PaginatedResponse<Stock>> => {
    const defaultRequest: SearchRequest = {
      where: {},
      skip: 0,
      take: 10,
      sort: [{ field: 'createdAt', direction: 'DESC' }],
    };
    const request = { ...defaultRequest, ...searchRequest };
    const response = await api.post('/stocks/search', request);
    return response.data;
  },

  getCount: async () => {
    const response = await api.get('/stocks/stats/count');
    return response.data;
  },

  activateStock: async (id: string): Promise<Stock> => {
    const response = await api.patch(`/stocks/${id}/activate`);
    return response.data;
  },

  deactivateStock: async (id: string): Promise<Stock> => {
    const response = await api.patch(`/stocks/${id}/deactivate`);
    return response.data;
  },

  getAllStock: async (): Promise<Stock[]> => {
    const response = await api.post('/stocks/search', {
      where: {},
      skip: 0,
      take: 1000,
      sort: [{ field: 'createdAt', direction: 'ASC' }],
    });
    return response.data?.data || [];
  },

  getActiveStock: async (): Promise<Stock[]> => {
    const response = await api.post('/stocks/search', {
      where: { active: true },
      skip: 0,
      take: 1000,
      sort: [{ field: 'createdAt', direction: 'ASC' }],
    });
    return response.data?.data || [];
  },

  getMovementHistory: async (productPublicId: string): Promise<StockMovement[]> => {
    const response = await api.get(`/stock-movements/by-product/${productPublicId}`);
    return response.data;
  },

  getMovementsByType: async (type: string): Promise<StockMovement[]> => {
    const response = await api.get(`/stock-movements/search/by-type?type=${type}`);
    return response.data?.data || [];
  },

  getMovementsByDateRange: async (startDate: string, endDate: string): Promise<StockMovement[]> => {
    const response = await api.get(`/stock-movements/search/by-date-range?startDate=${startDate}&endDate=${endDate}`);
    return response.data?.data || [];
  },

  createMovement: async (movementData: Partial<StockMovement>): Promise<StockMovement> => {
    const response = await api.post('/stock-movements', movementData);
    return response.data;
  },

  getMovementById: async (id: string): Promise<StockMovement> => {
    const response = await api.get(`/stock-movements/${id}`);
    return response.data;
  },

  updateMovement: async (id: string, movementData: Partial<StockMovement>): Promise<StockMovement> => {
    const response = await api.put(`/stock-movements/${id}`, movementData);
    return response.data;
  },

  deleteMovement: async (id: string): Promise<void> => {
    await api.delete(`/stock-movements/${id}`);
  },

  searchMovements: async (searchRequest: SearchRequest = {}): Promise<PaginatedResponse<StockMovement>> => {
    const defaultRequest: SearchRequest = {
      where: {},
      skip: 0,
      take: 10,
      sort: [{ field: 'createdAt', direction: 'DESC' }],
    };
    const request = { ...defaultRequest, ...searchRequest };
    const response = await api.post('/stock-movements/search', request);
    return response.data;
  },

  getMovementCount: async () => {
    const response = await api.get('/stock-movements/stats/count');
    return response.data;
  },

  adjustStock: async (productPublicId: string, newQuantity: number, description?: string): Promise<StockMovement> => {
    const response = await api.post('/stock-movements', {
      productPublicId,
      movementType: 'ADJUSTMENT',
      quantity: newQuantity,
      referenceType: 'ADJUSTMENT',
      description: description || 'Ajuste manual de estoque',
    });
    return response.data;
  },
};
