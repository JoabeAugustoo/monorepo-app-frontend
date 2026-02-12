import api from './api';
import type { Customer, CustomerDto, CustomerWithAddresses, SearchRequest, PaginatedResponse } from '../types';

export const customerService = {
  findByCpf: async (cpf: string): Promise<CustomerWithAddresses> => {
    const cleanCpf = cpf.replace(/\D/g, '');
    const response = await api.get(`/customers/cpf/${cleanCpf}`);
    return response.data;
  },

  getCustomerById: async (id: string): Promise<Customer> => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  createCustomer: async (data: CustomerDto): Promise<Customer> => {
    const response = await api.post('/customers', data);
    return response.data;
  },

  updateCustomer: async (id: string, data: Partial<CustomerDto>): Promise<Customer> => {
    const response = await api.put(`/customers/${id}`, data);
    return response.data;
  },

  deleteCustomer: async (id: string): Promise<void> => {
    await api.delete(`/customers/${id}`);
  },

  searchCustomers: async (searchRequest: SearchRequest = {}): Promise<PaginatedResponse<Customer>> => {
    const defaultRequest: SearchRequest = {
      where: {},
      skip: 0,
      take: 10,
      sort: [{ field: 'createdAt', direction: 'DESC' }],
    };
    const request = { ...defaultRequest, ...searchRequest };
    const response = await api.post('/customers/search', request);
    return response.data;
  },

  getActiveCustomers: async (): Promise<Customer[]> => {
    const response = await api.get('/customers/active');
    return Array.isArray(response.data) ? response.data : response.data?.data || [];
  },

  getCount: async () => {
    const response = await api.get('/customers/stats/count');
    return response.data;
  },

  activateCustomer: async (id: string): Promise<Customer> => {
    const response = await api.patch(`/customers/${id}/activate`);
    return response.data;
  },

  deactivateCustomer: async (id: string): Promise<Customer> => {
    const response = await api.patch(`/customers/${id}/deactivate`);
    return response.data;
  },
};
