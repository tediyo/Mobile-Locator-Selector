export type ThemeMode = 'light' | 'dark';

export const light = {
  background: '#ffffff',
  foreground: '#0f172a',
  surface: '#f8fafc',
  surfaceHover: '#f1f5f9',
  cardBg: '#ffffff',
  cardBorder: '#e2e8f0',
  inputBg: '#ffffff',
  inputBorder: '#cbd5e1',
  muted: '#64748b',
  mutedStrong: '#334155',
  codeBg: '#f1f5f9',
  tagBg: '#fef3c7',
  tagText: '#92400e',
  badgeBg: '#fef3c7',
  badgeText: '#b45309',
  copyBtnBg: '#f1f5f9',
  copyBtnText: '#475569',
  accent: '#f59e0b',
  accentHover: '#d97706',
  primaryText: '#000000',
  error: '#ef4444',
  success: '#22c55e',
  tabInactive: '#64748b',
  tabActiveBg: '#ffffff',
};

export const dark = {
  background: '#000000',
  foreground: '#f8fafc',
  surface: '#18181b',
  surfaceHover: '#27272a',
  cardBg: '#09090b',
  cardBorder: '#27272a',
  inputBg: '#09090b',
  inputBorder: '#3f3f46',
  muted: '#a1a1aa',
  mutedStrong: '#d4d4d8',
  codeBg: '#18181b',
  tagBg: 'rgba(245, 158, 11, 0.15)',
  tagText: '#fbbf24',
  badgeBg: 'rgba(245, 158, 11, 0.15)',
  badgeText: '#fbbf24',
  copyBtnBg: '#18181b',
  copyBtnText: '#a1a1aa',
  accent: '#f59e0b',
  accentHover: '#fbbf24',
  primaryText: '#000000',
  error: '#f87171',
  success: '#4ade80',
  tabInactive: '#a1a1aa',
  tabActiveBg: '#27272a',
};

export type AppColors = typeof light;

export function getColors(theme: ThemeMode): AppColors {
  return theme === 'dark' ? dark : light;
}
