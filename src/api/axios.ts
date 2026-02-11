import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:8081',
  headers: {
    'Content-Type': 'application/json',
  },
});

let tokenGetter: (() => string | null) | null = null;

export const setTokenGetter = (getter: () => string | null) => {
  tokenGetter = getter;
};

api.interceptors.request.use(
  (config) => {
    // Try to get token from tokenGetter first
    let token = tokenGetter?.();
    
    // If no token from getter, try localStorage directly (fallback for initial loads)
    if (!token) {
      token = localStorage.getItem('token');
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
