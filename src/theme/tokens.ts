import { Platform } from 'react-native';

/**
 * Centralized design tokens for a clean, professional and consistent UI.
 * Use these instead of magic numbers so spacing, radii and type scale
 * stay uniform across every screen.
 */

/** 4pt spacing scale */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

/** Corner radii */
export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 999,
} as const;

/** Type scale (font sizes) */
export const fontSize = {
  xs: 11,
  sm: 13,
  md: 14,
  lg: 16,
  xl: 18,
  '2xl': 22,
  '3xl': 28,
} as const;

/** Font weights as RN-compatible strings */
export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
} as const;

/** Letter spacing presets */
export const letterSpacing = {
  tight: -0.2,
  normal: 0,
  wide: 0.5,
  wider: 1,
} as const;

type ShadowStyle = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
};

/**
 * Elevation presets. Pass the theme shadow color so shadows read well in
 * both light and dark mode. Use spread into a style array.
 */
export function shadow(level: 'none' | 'sm' | 'md' | 'lg', color = '#0f172a'): ShadowStyle {
  const presets: Record<typeof level, ShadowStyle> = {
    none: { shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
    sm: { shadowColor: color, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 1 },
    md: { shadowColor: color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 },
    lg: { shadowColor: color, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.12, shadowRadius: 22, elevation: 8 },
  };
  return presets[level];
}

/** Shared monospace font family per platform (for code/locator output) */
export const monoFont = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) as string;
