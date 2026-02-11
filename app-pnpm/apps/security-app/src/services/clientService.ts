import api from './api';
import type {
  Client,
  ClientWithSecret,
  CreateClientRequest,
  UpdateClientRequest,
  AssignClientRoleRequest,
  ClientRoleResponse,
  SearchRequest,
  PaginatedResponse,
  CountResponse,
} from '../types';

export const clientService = {
  create: async (appPublicId: string, data: CreateClientRequest): Promise<ClientWithSecret> => {
    const response = await api.post<ClientWithSecret>(
      `/api/applications/${appPublicId}/clients`,
      data,
    );
    return response.data;
  },

  getByApplication: async (appPublicId: string): Promise<Client[]> => {
    const response = await api.get<Client[]>(`/api/applications/${appPublicId}/clients`);
    return response.data;
  },

  getById: async (clientPublicId: string): Promise<Client> => {
    const response = await api.get<Client>(`/api/clients/${clientPublicId}`);
    return response.data;
  },

  update: async (clientPublicId: string, data: UpdateClientRequest): Promise<Client> => {
    const response = await api.patch<Client>(`/api/clients/${clientPublicId}`, data);
    return response.data;
  },

  delete: async (clientPublicId: string): Promise<void> => {
    await api.delete(`/api/clients/${clientPublicId}`);
  },

  search: async (request: SearchRequest): Promise<PaginatedResponse<Client>> => {
    const response = await api.post<PaginatedResponse<Client>>('/api/clients/search', request);
    return response.data;
  },

  getCount: async (): Promise<CountResponse> => {
    const response = await api.get<CountResponse>('/api/clients/stats/count');
    return response.data;
  },

  activate: async (clientPublicId: string): Promise<Client> => {
    const response = await api.patch<Client>(`/api/clients/${clientPublicId}/activate`);
    return response.data;
  },

  deactivate: async (clientPublicId: string): Promise<Client> => {
    const response = await api.patch<Client>(`/api/clients/${clientPublicId}/deactivate`);
    return response.data;
  },

  rotateSecret: async (clientPublicId: string): Promise<ClientWithSecret> => {
    const response = await api.post<ClientWithSecret>(
      `/api/clients/${clientPublicId}/rotate-secret`,
    );
    return response.data;
  },

  assignRole: async (
    clientPublicId: string,
    data: AssignClientRoleRequest,
  ): Promise<ClientRoleResponse> => {
    const response = await api.post<ClientRoleResponse>(
      `/api/clients/${clientPublicId}/roles`,
      data,
    );
    return response.data;
  },

  removeRole: async (clientPublicId: string, rolePublicId: string): Promise<void> => {
    await api.delete(`/api/clients/${clientPublicId}/roles/${rolePublicId}`);
  },
};
