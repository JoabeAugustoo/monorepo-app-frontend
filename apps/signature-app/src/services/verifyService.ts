import { publicApi } from './api';
import type { VerificationResponse } from '../types';

export const verifyService = {
  verify: async (documentId: string): Promise<VerificationResponse> => {
    const response = await publicApi.get<VerificationResponse>(`/api/verify/${documentId}`);
    return response.data;
  },
};
