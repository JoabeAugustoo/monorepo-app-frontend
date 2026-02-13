import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AuthRespostaLogin, AuthUsuario } from '../types';

const TOKEN_KEY = 'pet-auth-token';
const USUARIO_KEY = 'pet-auth-usuario';

function lerToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function lerUsuario(): AuthUsuario | null {
  try {
    const json = localStorage.getItem(USUARIO_KEY);
    return json ? (JSON.parse(json) as AuthUsuario) : null;
  } catch {
    return null;
  }
}

function salvarAuth(token: string, usuario: AuthUsuario): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
  } catch { /* ignore */ }
}

function limparAuth(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USUARIO_KEY);
  } catch { /* ignore */ }
}

export interface AuthContextValue {
  token: string | null;
  usuario: AuthUsuario | null;
  carregando: boolean;
  autenticado: boolean;
  login: (resposta: AuthRespostaLogin) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuthState(onLogout?: () => void): AuthContextValue {
  const [token, setToken] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<AuthUsuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    setToken(lerToken());
    setUsuario(lerUsuario());
    setCarregando(false);
  }, []);

  const login = useCallback((resposta: AuthRespostaLogin) => {
    salvarAuth(resposta.token, resposta.usuario);
    try {
      const payload = JSON.parse(atob(resposta.token.split('.')[1]));
      if (payload?.config?.theme) {
        localStorage.setItem('pet-sidebar-tema', payload.config.theme);
      }
    } catch { /* ignore */ }
    setToken(resposta.token);
    setUsuario(resposta.usuario);
  }, []);

  const logout = useCallback(() => {
    limparAuth();
    onLogout?.();
    setToken(null);
    setUsuario(null);
  }, [onLogout]);

  return {
    token,
    usuario,
    carregando,
    autenticado: !!token && !!usuario,
    login,
    logout,
  };
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return ctx;
}

export function useAuthOpcional(): AuthContextValue | null {
  return useContext(AuthContext);
}
