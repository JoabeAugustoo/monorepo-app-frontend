import { publicApi, API_URL } from './api';
import type { SigningInfo, SigningTokenResponse, OtpRequest, OtpVerifyRequest } from '../types';

export const signingService = {
  validateToken: async (token: string): Promise<SigningInfo> => {
    const response = await publicApi.post<SigningTokenResponse>(`/api/signing/${token}`);
    const { signer, document, previewUrl } = response.data;
    return {
      documentId: document.publicId,
      documentName: document.fileName,
      companyName: document.company.name,
      companyCnpj: document.company.cnpj,
      signerName: signer.name,
      signerEmail: signer.email,
      signerPhone: signer.phone,
      status: signer.status,
      previewUrl: `${API_URL}${previewUrl}`,
    };
  },

  requestOtp: async (token: string, data: OtpRequest): Promise<void> => {
    await publicApi.post(`/api/signing/${token}/otp`, data);
  },

  verifyOtp: async (token: string, data: OtpVerifyRequest): Promise<void> => {
    await publicApi.post(`/api/signing/${token}/verify-otp`, data);
  },

  sign: async (token: string): Promise<{ documentId: string }> => {
    const response = await publicApi.post<{ documentId: string }>(`/api/signing/${token}/sign`);
    return response.data;
  },
};
