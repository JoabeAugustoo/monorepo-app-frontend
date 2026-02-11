import api from './api';
import type {
  Application,
  CreateApplicationRequest,
  UpdateApplicationRequest,
  SearchRequest,
  PaginatedResponse,
  CountResponse,
  ApplicationUserInfo,
  UserRoleResponse,
  ApplicationUserSearchResponse,
  ApplicationRoleSearchResponse,
  AddUserToApplicationRequest,
  Role,
} from '../types';

export const applicationService = {
  getById: async (id: string): Promise<Application> => {
    const response = await api.get<Application>(`/api/applications/${id}`);
    return response.data;
  },

  getCount: async (): Promise<CountResponse> => {
    const response = await api.get<CountResponse>('/api/applications/stats/count');
    return response.data;
  },

  create: async (data: CreateApplicationRequest): Promise<Application> => {
    const response = await api.post<Application>('/api/applications', data);
    return response.data;
  },

  update: async (id: string, data: UpdateApplicationRequest): Promise<Application> => {
    const response = await api.put<Application>(`/api/applications/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/applications/${id}`);
  },

  activate: async (id: string): Promise<Application> => {
    const response = await api.patch<Application>(`/api/applications/${id}/activate`);
    return response.data;
  },

  deactivate: async (id: string): Promise<Application> => {
    const response = await api.patch<Application>(`/api/applications/${id}/deactivate`);
    return response.data;
  },

  search: async (request: SearchRequest): Promise<PaginatedResponse<Application>> => {
    const response = await api.post<PaginatedResponse<Application>>(
      '/api/applications/search',
      request,
    );
    return response.data;
  },

  getApplicationUsers: async (appPublicId: string): Promise<ApplicationUserInfo[]> => {
    const response = await api.get<ApplicationUserInfo[]>(
      `/api/applications/${appPublicId}/users`,
    );
    return response.data;
  },

  addUserToApplication: async (
    appPublicId: string,
    data: AddUserToApplicationRequest,
  ): Promise<ApplicationUserSearchResponse> => {
    const response = await api.post<ApplicationUserSearchResponse>(
      `/api/applications/${appPublicId}/users`,
      data,
    );
    return response.data;
  },

  assignUserRole: async (
    appPublicId: string,
    userPublicId: string,
    rolePublicId: string,
  ): Promise<UserRoleResponse> => {
    const response = await api.post<UserRoleResponse>(
      `/api/applications/${appPublicId}/users/${userPublicId}/roles`,
      { rolePublicId },
    );
    return response.data;
  },

  removeUserRole: async (
    appPublicId: string,
    userPublicId: string,
    rolePublicId: string,
  ): Promise<void> => {
    await api.delete(
      `/api/applications/${appPublicId}/users/${userPublicId}/roles/${rolePublicId}`,
    );
  },

  removeUserFromApplication: async (
    appPublicId: string,
    userPublicId: string,
  ): Promise<void> => {
    await api.delete(`/api/applications/${appPublicId}/users/${userPublicId}`);
  },

  searchApplicationUsers: async (
    appPublicId: string,
    request: SearchRequest,
  ): Promise<PaginatedResponse<ApplicationUserSearchResponse>> => {
    const response = await api.post<PaginatedResponse<ApplicationUserSearchResponse>>(
      `/api/applications/${appPublicId}/users/search`,
      request,
    );
    return response.data;
  },

  searchApplicationRoles: async (
    appPublicId: string,
    request: SearchRequest,
  ): Promise<PaginatedResponse<ApplicationRoleSearchResponse>> => {
    const response = await api.post<PaginatedResponse<ApplicationRoleSearchResponse>>(
      `/api/applications/${appPublicId}/roles/search`,
      request,
    );
    return response.data;
  },

  // Global Roles
  getEnabledGlobalRoles: async (appPublicId: string): Promise<Role[]> => {
    const response = await api.get<Role[]>(`/api/applications/${appPublicId}/global-roles`);
    return response.data;
  },

  enableGlobalRole: async (appPublicId: string, rolePublicId: string): Promise<void> => {
    await api.post(`/api/applications/${appPublicId}/global-roles`, { rolePublicId });
  },

  disableGlobalRole: async (appPublicId: string, rolePublicId: string): Promise<void> => {
    await api.delete(`/api/applications/${appPublicId}/global-roles/${rolePublicId}`);
  },
};
