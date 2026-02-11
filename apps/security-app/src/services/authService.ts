import axios from 'axios';
import type { LoginResponse, TokenPayload, SecurityUser, SecurityGranularRole } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

const authApi = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

function decodeJwt(token: string): TokenPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export const authService = {
  login: async (username: string, password: string): Promise<{ user: SecurityUser; token: string }> => {
    try {
      const response = await authApi.post<LoginResponse>('/api/auth/login', { username, password });
      const data = response.data;

      if (data.accessToken) {
        localStorage.setItem('authToken', data.accessToken);

        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }

        localStorage.setItem('loginData', JSON.stringify(data));

        const tokenPayload = decodeJwt(data.accessToken);
        const roles = (tokenPayload?.roles || []) as SecurityGranularRole[];

        const user: SecurityUser = {
          id: tokenPayload?.sub || '',
          guid: tokenPayload?.sub || '',
          username: tokenPayload?.username || '',
          email: tokenPayload?.email || '',
          name: tokenPayload?.username || '',
          app: tokenPayload?.app || '',
          roles,
        };

        localStorage.setItem('user', JSON.stringify(user));
        return { user, token: data.accessToken };
      }

      throw new Error('Token nao recebido');
    } catch (error: unknown) {
      const axiosErr = error as { response?: { status?: number }; message?: string };
      if (axiosErr.response?.status === 401) {
        throw new Error('Credenciais invalidas');
      }
      if (axiosErr.response?.status === 503) {
        throw new Error('Servico de autenticacao indisponivel');
      }
      throw new Error('Erro ao fazer login: ' + (axiosErr.message || ''));
    }
  },

  refreshToken: async (): Promise<LoginResponse> => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('Refresh token nao encontrado');
      }

      const response = await authApi.post<LoginResponse>('/api/auth/refresh', { refreshToken });
      const data = response.data;

      if (data.accessToken) {
        localStorage.setItem('authToken', data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        localStorage.setItem('loginData', JSON.stringify(data));

        const tokenPayload = decodeJwt(data.accessToken);
        const roles = (tokenPayload?.roles || []) as SecurityGranularRole[];

        const user: SecurityUser = {
          id: tokenPayload?.sub || '',
          guid: tokenPayload?.sub || '',
          username: tokenPayload?.username || '',
          email: tokenPayload?.email || '',
          name: tokenPayload?.username || '',
          app: tokenPayload?.app || '',
          roles,
        };

        localStorage.setItem('user', JSON.stringify(user));
      }

      return data;
    } catch (error: unknown) {
      const axiosErr = error as { response?: { status?: number }; message?: string };
      if (axiosErr.response?.status === 401) {
        throw new Error('Refresh token invalido ou expirado');
      }
      throw new Error('Erro ao renovar token: ' + (axiosErr.message || ''));
    }
  },

  logout: (): void => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('loginData');
    localStorage.removeItem('pet-auth-token');
    localStorage.removeItem('pet-auth-usuario');
  },

  getCurrentUser: (): SecurityUser | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken: (): string | null => {
    return localStorage.getItem('authToken');
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('authToken');
  },
};
