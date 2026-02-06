import api from './axios';
import type {
  AssignRoleRequest,
  UserRoleResponse,
} from '../types';

export const userRolesApi = {
  assignRole: async (data: AssignRoleRequest): Promise<UserRoleResponse> => {
    const response = await api.post<UserRoleResponse>('/api/user-roles/assign', data);
    return response.data;
  },

  revokeRole: async (data: AssignRoleRequest): Promise<void> => {
    await api.delete('/api/user-roles/revoke', { data });
  },

  getUserRoles: async (userId: string): Promise<UserRoleResponse[]> => {
    const response = await api.get<UserRoleResponse[]>(`/api/user-roles/user/${userId}`);
    return response.data;
  },

  getUserRolesByApplication: async (userId: string, applicationId: string): Promise<UserRoleResponse[]> => {
    const response = await api.get<UserRoleResponse[]>(
      `/api/user-roles/user/${userId}/application/${applicationId}`
    );
    return response.data;
  },

  getApplicationUsers: async (applicationId: string): Promise<UserRoleResponse[]> => {
    const response = await api.get<UserRoleResponse[]>(`/api/user-roles/application/${applicationId}`);
    return response.data;
  },
};
