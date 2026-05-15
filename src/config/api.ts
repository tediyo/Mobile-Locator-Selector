import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_PORT = '3001';

/** Expo dev server host, e.g. 192.168.8.111 from exp://192.168.8.111:8081 */
function getExpoDevHost(): string | null {
  const uri =
    Constants.expoConfig?.hostUri ??
    (Constants as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig?.debuggerHost;
  if (!uri) return null;
  const host = uri.split(':')[0];
  if (!host || host === 'localhost' || host === '127.0.0.1') return null;
  return host;
}

function portFromUrl(url: string): string {
  try {
    return new URL(url).port || DEFAULT_PORT;
  } catch {
    return DEFAULT_PORT;
  }
}

/**
 * Resolves the backend URL for the current runtime.
 * - Physical device + localhost in .env → uses your PC's LAN IP from Expo (same as QR code host)
 * - Android emulator + localhost → 10.0.2.2
 * - iOS simulator → localhost
 */
export function resolveApiUrl(): string {
  const configured =
    (Constants.expoConfig?.extra?.apiUrl as string | undefined) ||
    process.env.EXPO_PUBLIC_API_URL ||
    '';

  const port = configured ? portFromUrl(configured) : DEFAULT_PORT;
  const isLocalhost =
    !configured ||
    configured.includes('localhost') ||
    configured.includes('127.0.0.1');

  if (!isLocalhost) {
    return configured.replace(/\/$/, '');
  }

  // Android emulator: localhost is the emulator itself, not your PC
  if (Platform.OS === 'android' && !Constants.isDevice) {
    return `http://10.0.2.2:${port}`;
  }

  // Physical device or Expo Go: use the same LAN IP as the Metro bundler
  const devHost = getExpoDevHost();
  if (devHost) {
    return `http://${devHost}:${port}`;
  }

  // iOS simulator can reach host machine via localhost
  if (Platform.OS === 'ios' && !Constants.isDevice) {
    return `http://localhost:${port}`;
  }

  return configured || `http://localhost:${port}`;
}

export const API_URL = resolveApiUrl();
