import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_PET_API_URL || 'http://localhost:8084/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pet-auth-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Refresh token logic ---
let refreshPromise: Promise<string> | null = null;

function forceLogout() {
  authService.logout();
  window.location.href = '/login';
}

async function handleRefresh(): Promise<string> {
  // Deduplicate: if a refresh is already in-flight, reuse it
  if (refreshPromise) return refreshPromise;

  refreshPromise = authService
    .refreshToken()
    .then((data) => {
      refreshPromise = null;
      return data.accessToken;
    })
    .catch((err) => {
      refreshPromise = null;
      throw err;
    });

  return refreshPromise;
}

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

      const refreshToken = localStorage.getItem('pet-auth-refresh');
      if (!refreshToken) {
        forceLogout();
        return Promise.reject(error);
      }

      try {
        const newToken = await handleRefresh();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        toast.error('Sessão expirada. Faça login novamente.');
        forceLogout();
        return Promise.reject(error);
      }
    }

    // 401 after retry — refresh also failed
    if (status === 401 && originalRequest._retry) {
      toast.error('Sessão expirada. Faça login novamente.');
      forceLogout();
      return Promise.reject(error);
    }

    if (status === 403) {
      toast.error('Você não tem permissão para realizar esta ação.');
      return Promise.reject(error);
    }

    if (status === 400) {
      toast.error(`Erro de validação: ${message}`);
      return Promise.reject(error);
    }

    if (status === 404) {
      toast.error(`Recurso não encontrado: ${message}`);
      return Promise.reject(error);
    }

    if (status === 500) {
      toast.error(`Erro no servidor: ${message}`);
      return Promise.reject(error);
    }

    if (error.code === 'ERR_NETWORK') {
      toast.error('Erro de conexão. Verifique se o servidor está online.');
      return Promise.reject(error);
    }

    if (message) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;
