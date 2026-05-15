import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';

export interface User {
  id: string;
  email: string;
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
  const router = useRouter();
  const segments = useSegments();

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

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === 'login' || segments[0] === 'signup';
    const inApp = segments[0] === '(main)';
    if (!user && !isGuest && !inAuth) {
      router.replace('/login');
    } else if ((user || isGuest) && inAuth) {
      router.replace('/(main)/(tabs)/overview');
    } else if ((user || isGuest) && !inApp && !inAuth && segments[0] !== '+not-found') {
      router.replace('/(main)/(tabs)/overview');
    }
  }, [user, isGuest, isLoading, segments, router]);

  const login = useCallback(async (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    setIsGuest(false);
    await AsyncStorage.multiSet([
      [TOKEN_KEY, newToken],
      [USER_KEY, JSON.stringify(newUser)],
    ]);
    await AsyncStorage.removeItem(GUEST_KEY);
    router.replace('/(main)/(tabs)/overview');
  }, [router]);

  const loginAsGuest = useCallback(async () => {
    setToken(null);
    setUser(null);
    setIsGuest(true);
    await AsyncStorage.setItem(GUEST_KEY, 'true');
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    router.replace('/(main)/(tabs)/overview');
  }, [router]);

  const logout = useCallback(async () => {
    setToken(null);
    setUser(null);
    setIsGuest(false);
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, GUEST_KEY]);
    router.replace('/login');
  }, [router]);

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
