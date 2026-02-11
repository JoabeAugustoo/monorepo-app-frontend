import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { rolesApi } from '../api/roles';
import { useAuth } from '../auth/AuthContext';
import { applicationKeys } from './useApplications';
import type { CreateRoleRequest, RoleDTO } from '../types';
import { toast } from 'sonner';

export const roleKeys = {
  all: ['roles'] as const,
  lists: () => [...roleKeys.all, 'list'] as const,
  list: () => [...roleKeys.lists()] as const,
  details: () => [...roleKeys.all, 'detail'] as const,
  detail: (id: string) => [...roleKeys.details(), id] as const,
  count: () => [...roleKeys.all, 'count'] as const,
};

export function useRoles() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: roleKeys.list(),
    queryFn: () => rolesApi.search({
      skip: 0,
      take: 100,
      where: { isAdministrative: true },
    }).then(res => res.data),
    enabled: isAuthenticated,
  });
}

export function useRole(id: string) {
  return useQuery({
    queryKey: roleKeys.detail(id),
    queryFn: () => rolesApi.getById(id),
    enabled: !!id,
  });
}

export function useRolesCount() {
  return useQuery({
    queryKey: roleKeys.count(),
    queryFn: rolesApi.getCount,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRoleRequest) => rolesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
      toast.success('Role criada com sucesso');
    },
    onError: () => {
      toast.error('Erro ao criar role');
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RoleDTO> }) =>
      rolesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
      toast.success('Role atualizada com sucesso');
    },
    onError: () => {
      toast.error('Erro ao atualizar role');
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => rolesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
      toast.success('Role excluída com sucesso');
    },
    onError: () => {
      toast.error('Erro ao excluir role');
    },
  });
}

export function useActivateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => rolesApi.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
      toast.success('Role ativada com sucesso');
    },
    onError: () => {
      toast.error('Erro ao ativar role');
    },
  });
}

export function useDeactivateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => rolesApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
      toast.success('Role desativada com sucesso');
    },
    onError: () => {
      toast.error('Erro ao desativar role');
    },
  });
}
