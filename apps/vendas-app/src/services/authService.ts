import axios from 'axios';
import type { VendasUser, UserRole, GranularRole } from '../types';

const AUTH_API_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:8083';

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
  is_employee?: boolean;
  public_id?: string;
  managerGuid?: string;
  managerName?: string;
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

const ADMIN_ACCESS_ROLES: GranularRole[] = [
  'ADMIN', 'VIEWER',
  'DASHBOARD_READ',
  'EMPLOYEE_READ', 'EMPLOYEE_WRITE',
  'PRODUCT_READ', 'PRODUCT_WRITE',
  'SALE_READ', 'SALE_WRITE',
  'PURCHASE_READ', 'PURCHASE_WRITE',
  'STOCK_READ', 'STOCK_WRITE',
  'STOCKMOVEMENT_READ', 'STOCKMOVEMENT_WRITE',
];

const mapRole = (roles: GranularRole[]): UserRole => {
  if (!roles || !Array.isArray(roles)) return 'employee';
  if (roles.includes('SUPER_ADMIN')) return 'super_admin';
  if (roles.includes('ADMIN')) return 'admin';
  if (roles.some(role => ADMIN_ACCESS_ROLES.includes(role))) return 'admin';
  return 'employee';
};

export const authService = {
  login: async (username: string, password: string): Promise<{ user: VendasUser; token: string }> => {
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
        const roles = (tokenPayload?.roles || []) as GranularRole[];
        const role = mapRole(roles);

        const user: VendasUser = {
          id: tokenPayload?.sub || '',
          guid: tokenPayload?.sub || '',
          username: tokenPayload?.username || '',
          email: tokenPayload?.email || '',
          name: tokenPayload?.username || '',
          app: tokenPayload?.app || '',
          isEmployee: data.is_employee || false,
          employeePublicId: data.public_id || null,
          managerGuid: data.managerGuid || null,
          managerName: data.managerName || null,
          tokenType: data.tokenType || 'Bearer',
          expiresIn: data.expiresIn || 0,
          roles,
          role,
        };

        localStorage.setItem('user', JSON.stringify(user));
        window.dispatchEvent(new CustomEvent('vendas-auth-change', { detail: { user } }));
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
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('Refresh token não encontrado');
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
        const roles = (tokenPayload?.roles || []) as GranularRole[];
        const role = mapRole(roles);
        const previousUser = authService.getCurrentUser();

        const user: VendasUser = {
          id: tokenPayload?.sub || '',
          guid: tokenPayload?.sub || '',
          username: tokenPayload?.username || '',
          email: tokenPayload?.email || '',
          name: tokenPayload?.username || '',
          app: tokenPayload?.app || '',
          isEmployee: data.is_employee ?? previousUser?.isEmployee ?? false,
          employeePublicId: data.public_id ?? previousUser?.employeePublicId ?? null,
          managerGuid: data.managerGuid ?? previousUser?.managerGuid ?? null,
          managerName: data.managerName ?? previousUser?.managerName ?? null,
          tokenType: data.tokenType || 'Bearer',
          expiresIn: data.expiresIn || 0,
          roles,
          role,
        };

        localStorage.setItem('user', JSON.stringify(user));
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
      const token = localStorage.getItem('authToken');
      if (!token) return false;

      const response = await authApi.post('/api/auth/validate', null, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return !!response.data;
    } catch {
      return false;
    }
  },

  introspectToken: async (): Promise<unknown> => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return null;

      const response = await authApi.post('/api/auth/introspect', null, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data;
    } catch {
      return null;
    }
  },

  logout: (): void => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('loginData');
    localStorage.removeItem('pet-auth-token');
    localStorage.removeItem('pet-auth-usuario');
    window.dispatchEvent(new CustomEvent('vendas-auth-change', { detail: { user: null } }));
  },

  getCurrentUser: (): VendasUser | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getLoginData: (): LoginResponse | null => {
    const loginDataStr = localStorage.getItem('loginData');
    return loginDataStr ? JSON.parse(loginDataStr) : null;
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('authToken');
  },

  getToken: (): string | null => {
    return localStorage.getItem('authToken');
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem('refreshToken');
  },
};
