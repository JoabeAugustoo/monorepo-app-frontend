import { createApiClient } from '@app/core';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8088';

const { api, publicApi } = createApiClient({
  baseURL: API_URL,
  tokenKey: 'authToken',
  refreshTokenKey: 'refreshToken',
  refreshUrl: '/api/auth/refresh',
});

export { api, publicApi };
export default api;
