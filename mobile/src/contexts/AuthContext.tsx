import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as api from '../services/api';
import type { UserProfile } from '../types';

interface AuthContextValue {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AUTH_TOKEN_KEY = 'cardpulse/token';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const savedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        if (!savedToken) {
          setLoading(false);
          return;
        }
        setToken(savedToken);
        try {
          const { user: profile } = await api.fetchSession(savedToken);
          setUser(profile);
        } catch (error) {
          await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
          setToken(null);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persistSession = useCallback(async (authToken: string, profile: UserProfile) => {
    setToken(authToken);
    setUser(profile);
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, authToken);
  }, []);

  const loginHandler = useCallback(async (email: string, password: string) => {
    const { token: authToken, user: profile } = await api.login({ email, password });
    await persistSession(authToken, profile);
  }, [persistSession]);

  const registerHandler = useCallback(
    async (email: string, password: string, displayName: string) => {
      await api.register({ email, password, displayName });
      await loginHandler(email, password);
    },
    [loginHandler],
  );

  const logoutHandler = useCallback(async () => {
    if (token) {
      try {
        await api.logout(token);
      } catch (error) {
        // ignore logout failures, session will be cleared locally
      }
    }
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      login: loginHandler,
      register: registerHandler,
      logout: logoutHandler,
    }),
    [loading, loginHandler, logoutHandler, registerHandler, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
