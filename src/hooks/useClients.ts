import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '../api/clients';
import type {
  CreateClientRequest,
  UpdateClientRequest,
  AssignClientRoleRequest,
  SearchRequest,
} from '../types';
import { toast } from 'sonner';
import { applicationKeys } from './useApplications';

export const clientKeys = {
  all: ['clients'] as const,
  lists: () => [...clientKeys.all, 'list'] as const,
  byApplication: (appPublicId: string) =>
    [...clientKeys.all, 'application', appPublicId] as const,
  details: () => [...clientKeys.all, 'detail'] as const,
  detail: (id: string) => [...clientKeys.details(), id] as const,
  count: () => [...clientKeys.all, 'count'] as const,
  search: (request: SearchRequest) => [...clientKeys.all, 'search', request] as const,
};

export function useAllClients() {
  return useQuery({
    queryKey: clientKeys.lists(),
    queryFn: () => clientsApi.search({ skip: 0, take: 1000 }),
  });
}

export function useClientsByApplication(appPublicId: string) {
  return useQuery({
    queryKey: clientKeys.byApplication(appPublicId),
    queryFn: () => clientsApi.getByApplication(appPublicId),
    enabled: !!appPublicId,
  });
}

export function useClient(clientPublicId: string) {
  return useQuery({
    queryKey: clientKeys.detail(clientPublicId),
    queryFn: () => clientsApi.getById(clientPublicId),
    enabled: !!clientPublicId,
  });
}

export function useClientsCount() {
  return useQuery({
    queryKey: clientKeys.count(),
    queryFn: clientsApi.getCount,
  });
}

export function useSearchClients() {
  return useMutation({
    mutationFn: (request: SearchRequest) => clientsApi.search(request),
    onError: () => {
      toast.error('Erro ao buscar clients');
    },
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      appPublicId,
      data,
    }: {
      appPublicId: string;
      data: CreateClientRequest;
    }) => clientsApi.create(appPublicId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
      toast.success('Client criado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao criar client');
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      clientPublicId,
      data,
    }: {
      clientPublicId: string;
      data: UpdateClientRequest;
    }) => clientsApi.update(clientPublicId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
      toast.success('Client atualizado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar client');
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clientPublicId: string) => clientsApi.delete(clientPublicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
      toast.success('Client excluido com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao excluir client');
    },
  });
}

export function useActivateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clientPublicId: string) => clientsApi.activate(clientPublicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
      toast.success('Client ativado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao ativar client');
    },
  });
}

export function useDeactivateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clientPublicId: string) => clientsApi.deactivate(clientPublicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
      toast.success('Client desativado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao desativar client');
    },
  });
}

export function useRotateClientSecret() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clientPublicId: string) => clientsApi.rotateSecret(clientPublicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
      toast.success('Secret rotacionado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao rotacionar secret');
    },
  });
}

export function useAssignClientRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      clientPublicId,
      data,
    }: {
      clientPublicId: string;
      data: AssignClientRoleRequest;
    }) => clientsApi.assignRole(clientPublicId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
      toast.success('Role atribuida ao client com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atribuir role ao client');
    },
  });
}

export function useRemoveClientRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      clientPublicId,
      rolePublicId,
    }: {
      clientPublicId: string;
      rolePublicId: string;
    }) => clientsApi.removeRole(clientPublicId, rolePublicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
      toast.success('Role removida do client com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao remover role do client');
    },
  });
}
