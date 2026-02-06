import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationGlobalRolesApi } from '../api/applicationGlobalRoles';
import { applicationKeys } from './useApplications';
import { roleKeys } from './useRoles';
import { toast } from 'sonner';

export const applicationGlobalRoleKeys = {
  all: ['applicationGlobalRoles'] as const,
  byApplication: (appPublicId: string) =>
    [...applicationGlobalRoleKeys.all, 'application', appPublicId] as const,
};

export function useApplicationGlobalRoles(appPublicId: string) {
  return useQuery({
    queryKey: applicationGlobalRoleKeys.byApplication(appPublicId),
    queryFn: () => applicationGlobalRolesApi.getEnabledGlobalRoles(appPublicId),
    enabled: !!appPublicId,
  });
}

export function useEnableGlobalRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      appPublicId,
      rolePublicId,
    }: {
      appPublicId: string;
      rolePublicId: string;
    }) => applicationGlobalRolesApi.enableGlobalRole(appPublicId, rolePublicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationGlobalRoleKeys.all });
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
      toast.success('Role global habilitada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao habilitar role global');
    },
  });
}

export function useDisableGlobalRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      appPublicId,
      rolePublicId,
    }: {
      appPublicId: string;
      rolePublicId: string;
    }) => applicationGlobalRolesApi.disableGlobalRole(appPublicId, rolePublicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationGlobalRoleKeys.all });
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
      toast.success('Role global desabilitada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao desabilitar role global');
    },
  });
}
