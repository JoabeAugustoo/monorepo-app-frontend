import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userRolesApi } from '../api/userAppRoles';
import { userKeys } from './useUsers';
import type { AssignRoleRequest } from '../types';
import { toast } from 'sonner';

export const userRolesKeys = {
  all: ['user-roles'] as const,
  applicationUsers: (applicationId: string) =>
    [...userRolesKeys.all, 'application', applicationId] as const,
  userRoles: (userId: string) =>
    [...userRolesKeys.all, 'user', userId] as const,
  userRolesByApp: (userId: string, applicationId: string) =>
    [...userRolesKeys.all, 'user', userId, 'application', applicationId] as const,
};

export function useLegacyApplicationUsers(applicationId: string) {
  return useQuery({
    queryKey: userRolesKeys.applicationUsers(applicationId),
    queryFn: () => userRolesApi.getApplicationUsers(applicationId),
    enabled: !!applicationId,
  });
}

export function useUserRoles(userId: string) {
  return useQuery({
    queryKey: userRolesKeys.userRoles(userId),
    queryFn: () => userRolesApi.getUserRoles(userId),
    enabled: !!userId,
  });
}

export function useUserRolesByApplication(userId: string, applicationId: string) {
  return useQuery({
    queryKey: userRolesKeys.userRolesByApp(userId, applicationId),
    queryFn: () => userRolesApi.getUserRolesByApplication(userId, applicationId),
    enabled: !!userId && !!applicationId,
  });
}

export function useAssignRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AssignRoleRequest) => userRolesApi.assignRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userRolesKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast.success('Role atribuída com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atribuir role');
    },
  });
}

export function useRevokeRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AssignRoleRequest) => userRolesApi.revokeRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userRolesKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast.success('Role revogada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao revogar role');
    },
  });
}
