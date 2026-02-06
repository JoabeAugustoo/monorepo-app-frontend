import api from './axios';
import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  SearchRequest,
  CountResponse,
  UserApplicationRoles,
} from '../types';

export const usersApi = {
  getById: async (id: string): Promise<User> => {
    const response = await api.get<User>(`/api/users/${id}`);
    return response.data;
  },

  getCount: async (): Promise<CountResponse> => {
    const response = await api.get<CountResponse>('/api/users/stats/count');
    return response.data;
  },

  create: async (data: CreateUserRequest): Promise<User> => {
    const response = await api.post<User>('/api/users', data);
    return response.data;
  },

  update: async (id: string, data: UpdateUserRequest): Promise<User> => {
    const response = await api.put<User>(`/api/users/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/users/${id}`);
  },

  activate: async (id: string): Promise<User> => {
    const response = await api.patch<User>(`/api/users/${id}/activate`);
    return response.data;
  },

  deactivate: async (id: string): Promise<User> => {
    const response = await api.patch<User>(`/api/users/${id}/deactivate`);
    return response.data;
  },

  search: async (request: SearchRequest): Promise<User[]> => {
    const response = await api.post<User[]>('/api/users/search', request);
    return response.data;
  },

  getUserApplications: async (userPublicId: string): Promise<UserApplicationRoles[]> => {
    const response = await api.get<UserApplicationRoles[]>(
      `/api/users/${userPublicId}/applications`
    );
    return response.data;
  },
};
