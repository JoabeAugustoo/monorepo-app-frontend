import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationsApi } from '../api/applications';
import { useAuth } from '../auth/AuthContext';
import type { CreateApplicationRequest, UpdateApplicationRequest, SearchRequest } from '../types';
import { toast } from 'sonner';
import { userKeys } from './useUsers';

export const applicationKeys = {
  all: ['applications'] as const,
  lists: () => [...applicationKeys.all, 'list'] as const,
  details: () => [...applicationKeys.all, 'detail'] as const,
  detail: (id: string) => [...applicationKeys.details(), id] as const,
  count: () => [...applicationKeys.all, 'count'] as const,
  search: (request: SearchRequest) => [...applicationKeys.all, 'search', request] as const,
  users: (appPublicId: string) => [...applicationKeys.all, 'users', appPublicId] as const,
  usersSearch: (appPublicId: string) => [...applicationKeys.all, 'users-search', appPublicId] as const,
  rolesSearch: (appPublicId: string) => [...applicationKeys.all, 'roles-search', appPublicId] as const,
};

export function useApplication(id: string) {
  return useQuery({
    queryKey: applicationKeys.detail(id),
    queryFn: () => applicationsApi.getById(id),
    enabled: !!id,
  });
}

export function useApplicationsCount() {
  return useQuery({
    queryKey: applicationKeys.count(),
    queryFn: applicationsApi.getCount,
  });
}

export function useSearchApplications() {
  return useMutation({
    mutationFn: (request: SearchRequest) => applicationsApi.search(request),
    onError: () => {
      toast.error('Erro ao buscar aplicações');
    },
  });
}

export function useApplications() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: applicationKeys.lists(),
    queryFn: () => applicationsApi.search({ skip: 0, take: 100 }),
    enabled: isAuthenticated,
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateApplicationRequest) => applicationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
      toast.success('Aplicação criada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao criar aplicação');
    },
  });
}

export function useUpdateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateApplicationRequest }) =>
      applicationsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
      toast.success('Aplicação atualizada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar aplicação');
    },
  });
}

export function useDeleteApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => applicationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
      toast.success('Aplicação excluída com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao excluir aplicação');
    },
  });
}

export function useActivateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => applicationsApi.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
      toast.success('Aplicação ativada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao ativar aplicação');
    },
  });
}

export function useDeactivateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => applicationsApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
      toast.success('Aplicação desativada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao desativar aplicação');
    },
  });
}

export function useApplicationUsers(appPublicId: string) {
  return useQuery({
    queryKey: applicationKeys.users(appPublicId),
    queryFn: () => applicationsApi.getApplicationUsers(appPublicId),
    enabled: !!appPublicId,
  });
}

export function useAddUserToApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      appPublicId,
      userPublicId,
      rolePublicIds,
    }: {
      appPublicId: string;
      userPublicId: string;
      rolePublicIds: string[];
    }) => applicationsApi.addUserToApplication(appPublicId, { userPublicId, rolePublicIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast.success('Usuario adicionado a aplicacao com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao adicionar usuario a aplicacao');
    },
  });
}

export function useAssignUserRoleToApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      appPublicId,
      userPublicId,
      rolePublicId,
    }: {
      appPublicId: string;
      userPublicId: string;
      rolePublicId: string;
    }) => applicationsApi.assignUserRole(appPublicId, userPublicId, rolePublicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast.success('Role atribuida ao usuario com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atribuir role ao usuario');
    },
  });
}

export function useRemoveUserRoleFromApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      appPublicId,
      userPublicId,
      rolePublicId,
    }: {
      appPublicId: string;
      userPublicId: string;
      rolePublicId: string;
    }) => applicationsApi.removeUserRole(appPublicId, userPublicId, rolePublicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast.success('Role removida do usuario com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao remover role do usuario');
    },
  });
}

export function useRemoveUserFromApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      appPublicId,
      userPublicId,
    }: {
      appPublicId: string;
      userPublicId: string;
    }) => applicationsApi.removeUserFromApplication(appPublicId, userPublicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast.success('Usuario removido da aplicacao com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao remover usuario da aplicacao');
    },
  });
}

export function useApplicationUsersSearch(appPublicId: string) {
  return useQuery({
    queryKey: applicationKeys.usersSearch(appPublicId),
    queryFn: () => applicationsApi.searchApplicationUsers(appPublicId, { skip: 0, take: 100 }),
    enabled: !!appPublicId,
  });
}

export function useApplicationRolesSearch(appPublicId: string) {
  return useQuery({
    queryKey: applicationKeys.rolesSearch(appPublicId),
    queryFn: () => applicationsApi.searchApplicationRoles(appPublicId, { skip: 0, take: 100 }),
    enabled: !!appPublicId,
  });
}
