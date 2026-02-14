import axios from 'axios';
import type { ReportUser } from '../types';

const AUTH_API_URL = import.meta.env.VITE_REPORT_AUTH_URL || 'http://localhost:8085';

const authApi = axios.create({
  baseURL: AUTH_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface JwtPayload {
  sub: string;
  username?: string;
  email?: string;
  app?: string;
  exp?: number;
}

interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
}

const decodeJwt = (token: string): JwtPayload | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

export const authService = {
  login: async (username: string, password: string): Promise<{ user: ReportUser; token: string }> => {
    try {
      const response = await authApi.post<LoginResponse>('/api/auth/login', { username, password });
      const data = response.data;

      if (data.accessToken) {
        localStorage.setItem('report-auth-token', data.accessToken);

        if (data.refreshToken) {
          localStorage.setItem('report-auth-refresh', data.refreshToken);
        }

        localStorage.setItem('report-auth-login-data', JSON.stringify(data));

        const tokenPayload = decodeJwt(data.accessToken);

        const user: ReportUser = {
          id: tokenPayload?.sub || '',
          username: tokenPayload?.username || '',
          email: tokenPayload?.email || '',
          name: tokenPayload?.username || '',
        };

        localStorage.setItem('report-auth-user', JSON.stringify(user));
        window.dispatchEvent(new CustomEvent('report-auth-change', { detail: { user } }));
        return { user, token: data.accessToken };
      }

      throw new Error('Token não recebido');
    } catch (error: unknown) {
      const axiosErr = error as { response?: { status?: number }; message?: string };
      if (axiosErr.response?.status === 401) {
        throw new Error('Credenciais inválidas');
      }
      if (axiosErr.response?.status === 503) {
        throw new Error('Serviço de autenticação indisponível');
      }
      throw new Error('Erro ao fazer login: ' + (axiosErr.message || ''));
    }
  },

  refreshToken: async (): Promise<LoginResponse> => {
    try {
      const refreshToken = localStorage.getItem('report-auth-refresh');
      if (!refreshToken) {
        throw new Error('Refresh token não encontrado');
      }

      const response = await authApi.post<LoginResponse>('/api/auth/refresh', { refreshToken });
      const data = response.data;

      if (data.accessToken) {
        localStorage.setItem('report-auth-token', data.accessToken);

        if (data.refreshToken) {
          localStorage.setItem('report-auth-refresh', data.refreshToken);
        }

        localStorage.setItem('report-auth-login-data', JSON.stringify(data));

        const tokenPayload = decodeJwt(data.accessToken);

        const user: ReportUser = {
          id: tokenPayload?.sub || '',
          username: tokenPayload?.username || '',
          email: tokenPayload?.email || '',
          name: tokenPayload?.username || '',
        };

        localStorage.setItem('report-auth-user', JSON.stringify(user));
      }

      return data;
    } catch (error: unknown) {
      const axiosErr = error as { response?: { status?: number }; message?: string };
      if (axiosErr.response?.status === 401) {
        throw new Error('Refresh token inválido ou expirado');
      }
      throw new Error('Erro ao renovar token: ' + (axiosErr.message || ''));
    }
  },

  validateToken: async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem('report-auth-token');
      if (!token) return false;

      const response = await authApi.post('/api/auth/validate', null, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return !!response.data;
    } catch {
      return false;
    }
  },

  logout: (): void => {
    localStorage.removeItem('report-auth-token');
    localStorage.removeItem('report-auth-refresh');
    localStorage.removeItem('report-auth-user');
    localStorage.removeItem('report-auth-login-data');
    window.dispatchEvent(new CustomEvent('report-auth-change', { detail: { user: null } }));
  },

  getCurrentUser: (): ReportUser | null => {
    const userStr = localStorage.getItem('report-auth-user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('report-auth-token');
  },

  getToken: (): string | null => {
    return localStorage.getItem('report-auth-token');
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem('report-auth-refresh');
  },
};
