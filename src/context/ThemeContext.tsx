import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useColorScheme as useSystemScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getColors, type AppColors, type ThemeMode } from '../theme/colors';

interface ThemeContextType {
  theme: ThemeMode;
  colors: AppColors;
  toggleTheme: () => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const THEME_KEY = 'theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useSystemScheme();
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark') {
        setTheme(saved);
      } else if (system === 'light') {
        setTheme('light');
      }
      setMounted(true);
    })();
  }, [system]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(THEME_KEY, next);
      return next;
    });
  }, []);

  const colors = getColors(theme);

  if (!mounted) return null;

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
