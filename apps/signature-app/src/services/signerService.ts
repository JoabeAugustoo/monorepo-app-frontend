import api from './api';
import type { Signer, CreateSignerDTO, SearchRequest, PaginatedResponse } from '../types';

export const signerService = {
  create: async (data: CreateSignerDTO): Promise<Signer> => {
    const response = await api.post<Signer>('/api/signers', data);
    return response.data;
  },

  search: async (request: SearchRequest): Promise<PaginatedResponse<Signer>> => {
    const response = await api.post<PaginatedResponse<Signer>>('/api/signers/search', request);
    return response.data;
  },
};
