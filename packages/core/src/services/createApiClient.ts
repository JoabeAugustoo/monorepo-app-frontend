import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { AxiosInstance } from 'axios';
import { toast } from 'sonner';

export interface ApiClientConfig {
  baseURL: string;
  tokenKey: string;
  refreshTokenKey: string;
  refreshUrl: string;
  onLogout?: () => void;
}

export interface ApiClientResult {
  api: AxiosInstance;
  publicApi: AxiosInstance;
}

export function createApiClient(config: ApiClientConfig): ApiClientResult {
  const { baseURL, tokenKey, refreshTokenKey, refreshUrl, onLogout } = config;

  const api = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
  });

  const publicApi = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
  });

  // --- Request interceptor: inject auth token ---
  api.interceptors.request.use((reqConfig) => {
    const token = localStorage.getItem(tokenKey);
    if (token) {
      reqConfig.headers.Authorization = `Bearer ${token}`;
    }
    return reqConfig;
  });

  // --- Refresh token logic ---
  let refreshPromise: Promise<string> | null = null;

  function forceLogout() {
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(refreshTokenKey);
    if (onLogout) {
      onLogout();
    } else {
      window.location.href = '/login';
    }
  }

  async function handleRefresh(): Promise<string> {
    if (refreshPromise) return refreshPromise;

    const currentRefreshToken = localStorage.getItem(refreshTokenKey);
    if (!currentRefreshToken) {
      throw new Error('No refresh token');
    }

    refreshPromise = publicApi
      .post<{ accessToken: string; refreshToken: string }>(refreshUrl, {
        refreshToken: currentRefreshToken,
      })
      .then((response) => {
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem(tokenKey, accessToken);
        if (newRefreshToken) {
          localStorage.setItem(refreshTokenKey, newRefreshToken);
        }
        refreshPromise = null;
        return accessToken;
      })
      .catch((err) => {
        refreshPromise = null;
        throw err;
      });

    return refreshPromise;
  }

  // --- Response interceptor: handle 401 + errors ---
  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const status = error.response?.status;
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
      const message =
        (error.response?.data as Record<string, string>)?.message ||
        (error.response?.data as Record<string, string>)?.error ||
        error.message;

      // 401 — try refresh before kicking the user out
      if (status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const newToken = await handleRefresh();
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch {
          toast.error('Sessao expirada. Faca login novamente.');
          forceLogout();
          return Promise.reject(error);
        }
      }

      if (status === 401 && originalRequest._retry) {
        toast.error('Sessao expirada. Faca login novamente.');
        forceLogout();
        return Promise.reject(error);
      }

      if (status === 403) {
        toast.error('Voce nao tem permissao para realizar esta acao.');
        return Promise.reject(error);
      }

      if (status === 400) {
        toast.error(`Erro de validacao: ${message}`);
        return Promise.reject(error);
      }

      if (status === 404) {
        toast.error(`Recurso nao encontrado: ${message}`);
        return Promise.reject(error);
      }

      if (status === 500) {
        toast.error(`Erro no servidor: ${message}`);
        return Promise.reject(error);
      }

      if (error.code === 'ERR_NETWORK') {
        toast.error('Erro de conexao. Verifique se o servidor esta online.');
        return Promise.reject(error);
      }

      if (message) {
        toast.error(message);
      }

      return Promise.reject(error);
    },
  );

  return { api, publicApi };
}
