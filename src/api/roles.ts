import api from "./axios";
import type {
  Role,
  RoleDTO,
  CreateRoleRequest,
  SearchRequest,
  PaginatedResponse,
  CountResponse,
} from "../types";

export const rolesApi = {
  getById: async (id: string): Promise<Role> => {
    const response = await api.get<Role>(`/api/roles/${id}`);
    return response.data;
  },

  getCount: async (): Promise<CountResponse> => {
    const response = await api.get<CountResponse>("/api/roles/stats/count");
    return response.data;
  },

  create: async (data: CreateRoleRequest): Promise<Role> => {
    const response = await api.post<Role>("/api/roles", data);
    return response.data;
  },

  update: async (id: string, data: Partial<RoleDTO>): Promise<Role> => {
    const response = await api.put<Role>(`/api/roles/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/roles/${id}`);
  },

  activate: async (id: string): Promise<Role> => {
    const response = await api.patch<Role>(`/api/roles/${id}/activate`);
    return response.data;
  },

  deactivate: async (id: string): Promise<Role> => {
    const response = await api.patch<Role>(`/api/roles/${id}/deactivate`);
    return response.data;
  },

  search: async (request: SearchRequest): Promise<PaginatedResponse<Role>> => {
    const response = await api.post<PaginatedResponse<Role>>("/api/roles/search", request);
    return response.data;
  },
};
