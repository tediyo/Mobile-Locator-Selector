import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useColorScheme as useSystemScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getColors, type AppColors, type ThemeMode } from '../theme/colors';

export type ThemePreference = ThemeMode | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  themePreference: ThemePreference;
  colors: AppColors;
  setThemePreference: (pref: ThemePreference) => void;
  toggleTheme: () => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const THEME_KEY = 'theme';

function resolveTheme(preference: ThemePreference, system: 'light' | 'dark' | null | undefined): ThemeMode {
  if (preference === 'system') {
    return system === 'light' ? 'light' : 'dark';
  }
  return preference;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useSystemScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('dark');
  const [mounted, setMounted] = useState(false);

  const theme = resolveTheme(themePreference, system);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setThemePreferenceState(saved);
      } else if (system === 'light') {
        setThemePreferenceState('system');
      }
      setMounted(true);
    })();
  }, [system]);

  const setThemePreference = useCallback((pref: ThemePreference) => {
    setThemePreferenceState(pref);
    AsyncStorage.setItem(THEME_KEY, pref);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemePreferenceState((prev) => {
      const next: ThemePreference = resolveTheme(prev, system) === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(THEME_KEY, next);
      return next;
    });
  }, [system]);

  const colors = getColors(theme);

  return (
    <ThemeContext.Provider value={{ theme, themePreference, colors, setThemePreference, toggleTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
