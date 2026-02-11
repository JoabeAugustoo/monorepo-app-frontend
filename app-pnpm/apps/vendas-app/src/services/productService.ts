import api from './api';
import type { Product, SearchRequest, PaginatedResponse } from '../types';

export const productService = {
  getProductById: async (id: string): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  updateProduct: async (id: string, productData: Partial<Product>): Promise<Product> => {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },

  createProduct: async (productData: Partial<Product>): Promise<Product> => {
    const response = await api.post('/products', productData);
    return response.data;
  },

  searchProducts: async (searchRequest: SearchRequest = {}): Promise<PaginatedResponse<Product>> => {
    const defaultRequest: SearchRequest = {
      where: {},
      skip: 0,
      take: 10,
      sort: [{ field: 'createdAt', direction: 'DESC' }],
    };
    const request = { ...defaultRequest, ...searchRequest };
    const response = await api.post('/products/search', request);
    return response.data;
  },

  searchByName: async (name: string): Promise<Product[]> => {
    const response = await api.get(`/products/search/by-name?name=${encodeURIComponent(name)}`);
    return response.data?.data || [];
  },

  searchByPriceRange: async (minPrice: number, maxPrice: number): Promise<Product[]> => {
    const response = await api.get(`/products/search/by-price-range?minPrice=${minPrice}&maxPrice=${maxPrice}`);
    return response.data?.data || [];
  },

  getActiveProducts: async (): Promise<Product[]> => {
    const response = await api.get('/products/active');
    return response.data?.data || [];
  },

  getCount: async () => {
    const response = await api.get('/products/stats/count');
    return response.data;
  },

  activateProduct: async (id: string): Promise<Product> => {
    const response = await api.patch(`/products/${id}/activate`);
    return response.data;
  },

  deactivateProduct: async (id: string): Promise<Product> => {
    const response = await api.patch(`/products/${id}/deactivate`);
    return response.data;
  },

  softDeleteProduct: async (id: string): Promise<Product> => {
    const response = await api.patch(`/products/${id}/deactivate`);
    return response.data;
  },

  getAllProducts: async (page = 0, size = 10) => {
    const response = await api.post('/products/search', {
      where: {},
      skip: page * size,
      take: size,
      sort: [{ field: 'createdAt', direction: 'ASC' }],
    });

    const paginated = response.data;
    return {
      content: paginated.data || [],
      totalElements: paginated.total || 0,
      totalPages: paginated.totalPages || 1,
      size: paginated.size || size,
      number: paginated.page || page,
      first: !paginated.hasPrevious,
      last: !paginated.hasNext,
      numberOfElements: (paginated.data || []).length,
      hasNext: paginated.hasNext || false,
      hasPrevious: paginated.hasPrevious || false,
    };
  },
};
