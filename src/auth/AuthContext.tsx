import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi, type RegisterInput } from '../api';
import { AUTH_EXPIRED_EVENT } from '../lib/api';
import type { User } from '../lib/types';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  // We can't read httpOnly cookies, so always ask the API whether a session exists.
  const [loading, setLoading] = useState(true);

  // Restore the session on first load.
  useEffect(() => {
    let cancelled = false;
    authApi
      .profile()
      .then((profile) => { if (!cancelled) setUser(profile); })
      .catch(() => { /* not signed in */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // The API client fires this when the session can no longer be refreshed.
  useEffect(() => {
    const onExpired = () => { setUser(null); queryClient.clear(); };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, [queryClient]);

  const finishAuth = useCallback(async () => {
    // The register response omits phone/address, so always load the full profile.
    const profile = await authApi.profile();
    setUser(profile);
    return profile;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await authApi.login({ email, password });
    return finishAuth();
  }, [finishAuth]);

  const register = useCallback(async (input: RegisterInput) => {
    await authApi.register(input);
    return finishAuth();
  }, [finishAuth]);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* cookies may already be gone; still sign out locally */ }
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo(() => ({ user, loading, login, register, logout, setUser }), [user, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}