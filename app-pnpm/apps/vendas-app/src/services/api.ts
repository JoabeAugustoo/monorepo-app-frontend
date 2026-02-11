import axios from 'axios';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8083/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.response?.data?.error || error.message;

    if (status === 401) {
      toast.error('Sessão expirada. Faça login novamente.');
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('loginData');
      window.location.href = '/login';
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
