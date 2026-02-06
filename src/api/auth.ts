import api from './axios';
import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  TokenPayload,
} from '../types';


export const authApi = {
  login: async (data: Omit<LoginRequest, 'applicationId'>): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/api/auth/login', data);
    return response.data;
  },

  loginForApplication: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/api/auth/login', data);
    return response.data;
  },

  refresh: async (data: RefreshTokenRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/api/auth/refresh', data);
    return response.data;
  },

  validate: async (): Promise<TokenPayload> => {
    const response = await api.post<TokenPayload>('/api/auth/validate');
    return response.data;
  },

  introspect: async (): Promise<unknown> => {
    const response = await api.post('/api/auth/introspect');
    return response.data;
  },

  health: async (): Promise<string> => {
    const response = await api.get<string>('/api/health');
    return response.data;
  },
};
