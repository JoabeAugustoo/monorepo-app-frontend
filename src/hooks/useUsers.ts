import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../api/users';
import { useAuth } from '../auth/AuthContext';
import type { CreateUserRequest, UpdateUserRequest, SearchRequest } from '../types';
import { toast } from 'sonner';

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: () => [...userKeys.lists()] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  count: () => [...userKeys.all, 'count'] as const,
  search: (request: SearchRequest) => [...userKeys.all, 'search', request] as const,
  applications: (userPublicId: string) => [...userKeys.all, 'applications', userPublicId] as const,
};

export function useUsers() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: userKeys.list(),
    queryFn: () => usersApi.search({ skip: 0, take: 100 }),
    enabled: isAuthenticated,
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => usersApi.getById(id),
    enabled: !!id,
  });
}

export function useUsersCount() {
  return useQuery({
    queryKey: userKeys.count(),
    queryFn: usersApi.getCount,
  });
}

export function useSearchUsers() {
  return useMutation({
    mutationFn: (request: SearchRequest) => usersApi.search(request),
    onError: () => {
      toast.error('Erro ao buscar usuários');
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserRequest) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast.success('Usuário criado com sucesso');
    },
    onError: () => {
      toast.error('Erro ao criar usuário');
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserRequest }) =>
      usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast.success('Usuário atualizado com sucesso');
    },
    onError: () => {
      toast.error('Erro ao atualizar usuário');
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast.success('Usuário excluído com sucesso');
    },
    onError: () => {
      toast.error('Erro ao excluir usuário');
    },
  });
}

export function useActivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => usersApi.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast.success('Usuário ativado com sucesso');
    },
    onError: () => {
      toast.error('Erro ao ativar usuário');
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => usersApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast.success('Usuário desativado com sucesso');
    },
    onError: () => {
      toast.error('Erro ao desativar usuário');
    },
  });
}

export function useUserApplications(userPublicId: string) {
  return useQuery({
    queryKey: userKeys.applications(userPublicId),
    queryFn: () => usersApi.getUserApplications(userPublicId),
    enabled: !!userPublicId,
  });
}
