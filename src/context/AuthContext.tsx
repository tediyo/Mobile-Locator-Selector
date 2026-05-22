import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseOAuthCallback } from '../auth/oauth';
import { resetToRoute } from '../navigation/navigationRef';

export interface User {
  id: string;
  email: string;
  picture?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isGuest: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const GUEST_KEY = 'isGuest';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [savedToken, savedUser, savedGuest] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
          AsyncStorage.getItem(GUEST_KEY),
        ]);
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        } else if (savedGuest === 'true') {
          setIsGuest(true);
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    setIsGuest(false);
    await AsyncStorage.multiSet([
      [TOKEN_KEY, newToken],
      [USER_KEY, JSON.stringify(newUser)],
    ]);
    await AsyncStorage.removeItem(GUEST_KEY);
    resetToRoute('Main');
  }, []);

  const loginAsGuest = useCallback(async () => {
    setToken(null);
    setUser(null);
    setIsGuest(true);
    await AsyncStorage.setItem(GUEST_KEY, 'true');
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    resetToRoute('Main');
  }, []);

  const logout = useCallback(async () => {
    setToken(null);
    setUser(null);
    setIsGuest(false);
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, GUEST_KEY]);
    resetToRoute('Login');
  }, []);

  const handleOAuthUrl = useCallback(
    async (url: string | null) => {
      if (!url) return;
      const payload = parseOAuthCallback(url);
      if (payload) await login(payload.token, payload.user);
    },
    [login],
  );

  useEffect(() => {
    Linking.getInitialURL().then(handleOAuthUrl);
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleOAuthUrl(url);
    });
    return () => subscription.remove();
  }, [handleOAuthUrl]);

  return (
    <AuthContext.Provider value={{ user, token, isGuest, isLoading, login, loginAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
