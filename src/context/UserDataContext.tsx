import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch } from '../api/client';
import {
  cachedFetch,
  clearApiCache,
  historyCacheKey,
  invalidateCacheKey,
  profileCacheKey,
  setCachedValue,
} from '../api/requestCache';
import { resolveCreatedAt, resolveProfilePictureUrl } from '../lib/profilePicture';
import type { HistoryEntry, IndexedHistoryEntry } from '../lib/dashboard-analytics';
import { indexHistory } from '../lib/dashboard-analytics';
import { useAuth } from './AuthContext';

export interface ProfileData {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  isGoogleUser?: boolean;
  createdAt?: string;
  pictureUrl?: string;
}

interface UserDataContextType {
  history: HistoryEntry[] | null;
  indexedHistory: IndexedHistoryEntry[];
  historyLoading: boolean;
  refreshHistory: (force?: boolean) => Promise<void>;
  invalidateHistory: () => void;
  profile: ProfileData | null;
  profileLoading: boolean;
  refreshProfile: (force?: boolean) => Promise<void>;
  setProfileCache: (data: ProfileData) => void;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

function normalizeProfile(data: ProfileData & Record<string, unknown>): ProfileData {
  return {
    ...data,
    pictureUrl: resolveProfilePictureUrl(data) ?? data.pictureUrl,
    createdAt: resolveCreatedAt(data) ?? data.createdAt,
  };
}

export function UserDataProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const historyRef = useRef<HistoryEntry[] | null>(null);
  const profileRef = useRef<ProfileData | null>(null);

  historyRef.current = history;
  profileRef.current = profile;

  const indexedHistory = useMemo(
    () => (history ? indexHistory(history) : []),
    [history],
  );

  const refreshHistory = useCallback(
    async (force = false) => {
      if (!token) return;
      const key = historyCacheKey(token);
      const hasData = historyRef.current !== null;

      if (!hasData || force) {
        setHistoryLoading(true);
      }

      try {
        const result = await cachedFetch(
          key,
          async () => {
            const { ok, data } = await apiFetch<HistoryEntry[]>('/locator/history', { token });
            if (!ok) throw new Error('Failed to load history');
            return data;
          },
          { force },
        );
        setHistory(result);
      } catch {
        if (!hasData) setHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    },
    [token],
  );

  const invalidateHistory = useCallback(() => {
    if (token) invalidateCacheKey(historyCacheKey(token));
  }, [token]);

  const refreshProfile = useCallback(
    async (force = false) => {
      if (!token) return;
      const key = profileCacheKey(token);
      const hasData = profileRef.current !== null;

      if (!hasData || force) {
        setProfileLoading(true);
      }

      try {
        const result = await cachedFetch(
          key,
          async () => {
            const { ok, data } = await apiFetch<ProfileData & Record<string, unknown>>('/users/me', { token });
            if (!ok) throw new Error('Failed to load profile');
            return normalizeProfile(data);
          },
          { force },
        );
        setProfile(result);
      } catch {
        if (!hasData) setProfile(null);
      } finally {
        setProfileLoading(false);
      }
    },
    [token],
  );

  const setProfileCache = useCallback(
    (data: ProfileData) => {
      const next = normalizeProfile(data as ProfileData & Record<string, unknown>);
      setProfile(next);
      if (token) {
        setCachedValue(profileCacheKey(token), next);
      }
    },
    [token],
  );

  useEffect(() => {
    if (!token) {
      setHistory(null);
      setProfile(null);
      setHistoryLoading(false);
      setProfileLoading(false);
      clearApiCache();
      return;
    }
    refreshHistory();
    refreshProfile();
  }, [token, refreshHistory, refreshProfile]);

  const value = useMemo(
    () => ({
      history,
      indexedHistory,
      historyLoading,
      refreshHistory,
      invalidateHistory,
      profile,
      profileLoading,
      refreshProfile,
      setProfileCache,
    }),
    [
      history,
      indexedHistory,
      historyLoading,
      refreshHistory,
      invalidateHistory,
      profile,
      profileLoading,
      refreshProfile,
      setProfileCache,
    ],
  );

  return <UserDataContext.Provider value={value}>{children}</UserDataContext.Provider>;
}

export function useUserData() {
  const ctx = useContext(UserDataContext);
  if (!ctx) throw new Error('useUserData must be used within UserDataProvider');
  return ctx;
}
