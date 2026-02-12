import api from './api';
import type { CustomerAddress, AddressDto, CepResponse } from '../types';

export const addressService = {
  getCep: async (cep: string): Promise<CepResponse> => {
    const cleanCep = cep.replace(/\D/g, '');
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    return response.json();
  },

  addAddress: async (customerId: string, data: AddressDto): Promise<CustomerAddress> => {
    const response = await api.post(`/customers/${customerId}/addresses`, data);
    return response.data;
  },

  listAddresses: async (customerId: string): Promise<CustomerAddress[]> => {
    const response = await api.get(`/customers/${customerId}/addresses`);
    return Array.isArray(response.data) ? response.data : response.data?.data || [];
  },

  updateAddress: async (customerId: string, addressId: string, data: Partial<AddressDto>): Promise<CustomerAddress> => {
    const response = await api.patch(`/customers/${customerId}/addresses/${addressId}`, data);
    return response.data;
  },

  removeAddress: async (customerId: string, addressId: string): Promise<void> => {
    await api.delete(`/customers/${customerId}/addresses/${addressId}`);
  },
};
