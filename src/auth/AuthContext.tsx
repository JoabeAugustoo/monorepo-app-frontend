import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { setTokenGetter, api } from '../api/axios';
import type { TokenPayload } from '../types';

interface AuthUser {
  publicId: string;
  userName: string;
  email: string;
  roles: string[];
  app?: string;
}

type LoginCredentials = {
  username: string;
  password: string;
};

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginCredentials) => Promise<void>;
  logout: () => void;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

function parseJwt(token: string): TokenPayload | null {
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
}

function isTokenExpired(token: string): boolean {
  const payload = parseJwt(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize on mount - read from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      const storedToken = localStorage.getItem('token');
      const storedRefreshToken = localStorage.getItem('refreshToken');
      const storedUserJson = localStorage.getItem('user');

      // Check if token is expired
      if (!storedToken || isTokenExpired(storedToken)) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setToken(null);
        setRefreshToken(null);
        setUser(null);
        setTokenGetter(() => null);
        setIsLoading(false);
        return;
      }

      // Token exists and is valid
      const parsedUser = storedUserJson ? JSON.parse(storedUserJson) : null;

      setToken(storedToken);
      setRefreshToken(storedRefreshToken);
      setUser(parsedUser);
      setTokenGetter(() => storedToken);
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // Update token getter when token changes
  useEffect(() => {
    if (token) {
      setTokenGetter(() => token);
    }
  }, [token]);

  const refreshSession = useCallback(async () => {
    const currentRefreshToken = localStorage.getItem('refreshToken');

    if (!currentRefreshToken) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setToken(null);
      setRefreshToken(null);
      setUser(null);
      setTokenGetter(() => null);
      return;
    }

    try {
      const response = await authApi.refresh({ refreshToken: currentRefreshToken });
      const newToken = response.accessToken;
      const newRefreshToken = response.refreshToken;

      const payload = parseJwt(newToken);
      const userData: AuthUser = {
        publicId: payload?.sub || '',
        userName: payload?.username || '',
        email: payload?.email || '',
        roles: payload?.roles || [],
        app: payload?.app,
      };

      localStorage.setItem('token', newToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      localStorage.setItem('user', JSON.stringify(userData));

      setToken(newToken);
      setRefreshToken(newRefreshToken);
      setUser(userData);
      setTokenGetter(() => newToken);
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setToken(null);
      setRefreshToken(null);
      setUser(null);
      setTokenGetter(() => null);
    }
  }, []);

  // Setup 401 interceptor for logout
  useEffect(() => {
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        // Don't logout on login request failures
        const isLoginRequest = error.config?.url?.includes('/auth/login');

        if (error.response?.status === 401 && !isLoginRequest) {
          setToken(null);
          setRefreshToken(null);
          setUser(null);
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const login = useCallback(
    async (data: LoginCredentials) => {
      const response = await authApi.login(data);
      const newToken = response.accessToken;
      const newRefreshToken = response.refreshToken;

      if (!newToken) {
        throw new Error('Token não recebido do servidor');
      }

      const payload = parseJwt(newToken);

      const userData: AuthUser = {
        publicId: payload?.sub || '',
        userName: payload?.username || data.username,
        email: payload?.email || '',
        roles: payload?.roles || [],
        app: payload?.app,
      };

      // Save to localStorage first
      localStorage.setItem('token', newToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      localStorage.setItem('user', JSON.stringify(userData));

      // Configure token getter BEFORE updating state and navigating
      setTokenGetter(() => newToken);

      // Update state
      setToken(newToken);
      setRefreshToken(newRefreshToken);
      setUser(userData);

      // Navigate after everything is set
      navigate('/dashboard');
    },
    [navigate]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    navigate('/login');
  }, [navigate]);

  const hasRole = useCallback(
    (role: string): boolean => {
      if (!user || !user.roles) return false;
      return user.roles.some((r) => r === role || r === `ROLE_${role}`);
    },
    [user]
  );

  const hasAnyRole = useCallback(
    (roles: string[]): boolean => {
      return roles.some((role) => hasRole(role));
    },
    [hasRole]
  );

  const value = useMemo(
    () => ({
      user,
      token,
      refreshToken,
      isAuthenticated: !!token && !!user,
      isLoading,
      login,
      logout,
      hasRole,
      hasAnyRole,
      refreshSession,
    }),
    [user, token, refreshToken, isLoading, login, logout, hasRole, hasAnyRole, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
