import api from './axios';
import type { Role } from '../types';

export const applicationGlobalRolesApi = {
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
