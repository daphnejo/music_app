import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError, publicApiRequest, setApiAccessToken, setApiRefreshHandler } from '@/services/api/client';
import { getStoredRefreshToken, setStoredRefreshToken } from '@/services/auth/storage';

export type UserRole = 'student' | 'teacher' | 'content_editor' | 'admin';

export type AuthUser = {
  id: string;
  orgId: string | null;
  email: string;
  fullName: string;
  role: UserRole;
};

type SessionResponse = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTokenRef = useRef<string | null>(null);
  const accessTokenRef = useRef<string | null>(null);

  const applySession = useCallback(async (session: SessionResponse) => {
    refreshTokenRef.current = session.refreshToken;
    accessTokenRef.current = session.accessToken;
    setApiAccessToken(session.accessToken);
    setUser(session.user);
    await setStoredRefreshToken(session.refreshToken);
  }, []);

  const clearSession = useCallback(async () => {
    refreshTokenRef.current = null;
    accessTokenRef.current = null;
    setApiAccessToken(null);
    setUser(null);
    await setStoredRefreshToken(null);
  }, []);

  const refreshSession = useCallback(async (): Promise<string | null> => {
    const refreshToken = refreshTokenRef.current ?? (await getStoredRefreshToken());
    if (!refreshToken) return null;

    try {
      const session = await publicApiRequest<SessionResponse>('/api/auth/refresh', {
        method: 'POST',
        body: { refreshToken },
      });
      await applySession(session);
      return session.accessToken;
    } catch (error) {
      if (error instanceof ApiError && (error.status === 400 || error.status === 401)) {
        await clearSession();
        return null;
      }
      throw error;
    }
  }, [applySession, clearSession]);

  useEffect(() => {
    setApiRefreshHandler(refreshSession);
    let mounted = true;

    (async () => {
      try {
        const stored = await getStoredRefreshToken();
        if (stored) {
          refreshTokenRef.current = stored;
          await refreshSession();
        }
      } catch {
        // Network failure should not destroy a still-valid refresh token.
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
      setApiRefreshHandler(null);
    };
  }, [refreshSession]);

  const login = useCallback(async (email: string, password: string) => {
    const session = await publicApiRequest<SessionResponse>('/api/auth/login', {
      method: 'POST',
      body: { email: email.trim(), password },
    });
    await applySession(session);
  }, [applySession]);

  const logout = useCallback(async () => {
    const refreshToken = refreshTokenRef.current;
    try {
      if (refreshToken) {
        await publicApiRequest('/api/auth/logout', {
          method: 'POST',
          body: { refreshToken },
          headers: accessTokenRef.current ? { authorization: `Bearer ${accessTokenRef.current}` } : undefined,
        });
      }
    } catch {
      // Local logout should always work even if the server is unavailable.
    } finally {
      await clearSession();
    }
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, login, logout, refreshSession }),
    [user, isLoading, login, logout, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
