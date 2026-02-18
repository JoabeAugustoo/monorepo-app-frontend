import type { LoginResponse, TokenPayload, SignatureUser } from '../types';
import { publicApi } from './api';

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
  login: async (username: string, password: string): Promise<{ user: SignatureUser; token: string }> => {
    try {
      const response = await publicApi.post<LoginResponse>('/api/auth/login', { username, password });
      const data = response.data;

      if (data.accessToken) {
        localStorage.setItem('authToken', data.accessToken);

        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }

        localStorage.setItem('loginData', JSON.stringify(data));

        const tokenPayload = decodeJwt(data.accessToken);
        const roles = tokenPayload?.roles || [];

        const user: SignatureUser = {
          id: tokenPayload?.sub || '',
          guid: tokenPayload?.sub || '',
          username: tokenPayload?.username || '',
          email: tokenPayload?.email || '',
          name: tokenPayload?.username || '',
          app: tokenPayload?.app || '',
          roles,
        };

        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('pet-auth-token', data.accessToken);
        localStorage.setItem('pet-auth-usuario', JSON.stringify({ nomeUsuario: user.name }));
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

  logout: (): void => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('loginData');
    localStorage.removeItem('pet-auth-token');
    localStorage.removeItem('pet-auth-usuario');
  },

  getCurrentUser: (): SignatureUser | null => {
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
