import axios from 'axios';
import type { PetUser, UserRole, GranularRole } from '../types';

const AUTH_API_URL = import.meta.env.VITE_PET_AUTH_URL || 'http://localhost:8084';

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
  roles?: GranularRole[];
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

const mapRole = (roles: GranularRole[]): UserRole => {
  if (!roles || !Array.isArray(roles)) return 'employee';
  if (roles.includes('SUPER_ADMIN')) return 'super_admin';
  if (roles.includes('ADMIN')) return 'admin';
  return 'employee';
};

export const authService = {
  login: async (username: string, password: string): Promise<{ user: PetUser; token: string }> => {
    try {
      const response = await authApi.post<LoginResponse>('/api/auth/login', { username, password });
      const data = response.data;

      if (data.accessToken) {
        localStorage.setItem('pet-auth-token', data.accessToken);

        if (data.refreshToken) {
          localStorage.setItem('pet-auth-refresh', data.refreshToken);
        }

        localStorage.setItem('pet-auth-login-data', JSON.stringify(data));

        const tokenPayload = decodeJwt(data.accessToken);
        const roles = (tokenPayload?.roles || []) as GranularRole[];
        const role = mapRole(roles);

        const user: PetUser = {
          id: tokenPayload?.sub || '',
          guid: tokenPayload?.sub || '',
          username: tokenPayload?.username || '',
          email: tokenPayload?.email || '',
          name: tokenPayload?.username || '',
          app: tokenPayload?.app || '',
          tokenType: data.tokenType || 'Bearer',
          expiresIn: data.expiresIn || 0,
          roles,
          role,
        };

        localStorage.setItem('pet-auth-user', JSON.stringify(user));
        window.dispatchEvent(new CustomEvent('pet-auth-change', { detail: { user } }));
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
      const refreshToken = localStorage.getItem('pet-auth-refresh');
      if (!refreshToken) {
        throw new Error('Refresh token não encontrado');
      }

      const response = await authApi.post<LoginResponse>('/api/auth/refresh', { refreshToken });
      const data = response.data;

      if (data.accessToken) {
        localStorage.setItem('pet-auth-token', data.accessToken);

        if (data.refreshToken) {
          localStorage.setItem('pet-auth-refresh', data.refreshToken);
        }

        localStorage.setItem('pet-auth-login-data', JSON.stringify(data));

        const tokenPayload = decodeJwt(data.accessToken);
        const roles = (tokenPayload?.roles || []) as GranularRole[];
        const role = mapRole(roles);

        const user: PetUser = {
          id: tokenPayload?.sub || '',
          guid: tokenPayload?.sub || '',
          username: tokenPayload?.username || '',
          email: tokenPayload?.email || '',
          name: tokenPayload?.username || '',
          app: tokenPayload?.app || '',
          tokenType: data.tokenType || 'Bearer',
          expiresIn: data.expiresIn || 0,
          roles,
          role,
        };

        localStorage.setItem('pet-auth-user', JSON.stringify(user));
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
      const token = localStorage.getItem('pet-auth-token');
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
    localStorage.removeItem('pet-auth-token');
    localStorage.removeItem('pet-auth-refresh');
    localStorage.removeItem('pet-auth-user');
    localStorage.removeItem('pet-auth-login-data');
    window.dispatchEvent(new CustomEvent('pet-auth-change', { detail: { user: null } }));
  },

  getCurrentUser: (): PetUser | null => {
    const userStr = localStorage.getItem('pet-auth-user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('pet-auth-token');
  },

  getToken: (): string | null => {
    return localStorage.getItem('pet-auth-token');
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem('pet-auth-refresh');
  },
};
