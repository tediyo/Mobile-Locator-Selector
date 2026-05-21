import { NativeModules, Platform } from 'react-native';
import {
  API_BASE_URL,
  API_PORT,
  DEV_MACHINE_HOST,
  USE_LOCAL_API,
} from './env';

const DEFAULT_PORT = String(API_PORT);

function portFromUrl(url: string): string {
  try {
    return new URL(url).port || DEFAULT_PORT;
  } catch {
    return DEFAULT_PORT;
  }
}

/** Metro bundler host from React Native dev settings (debug builds). */
function getDevHost(): string | null {
  const scriptURL = NativeModules.SourceCode?.scriptURL;
  if (!scriptURL) return null;
  try {
    const host = new URL(scriptURL).hostname;
    if (!host || host === 'localhost' || host === '127.0.0.1') return null;
    return host;
  } catch {
    return null;
  }
}

function resolveLocalApiUrl(): string {
  const configured = process.env.API_URL ?? '';
  const port = configured ? portFromUrl(configured) : DEFAULT_PORT;

  if (Platform.OS === 'android') {
    const devHost = getDevHost();
    if (devHost) return `http://${devHost}:${port}`;
    return `http://10.0.2.2:${port}`;
  }

  if (Platform.OS === 'ios') {
    const devHost = getDevHost();
    if (devHost) return `http://${devHost}:${port}`;
    return `http://localhost:${port}`;
  }

  return `http://${DEV_MACHINE_HOST}:${port}`;
}

export function resolveApiUrl(): string {
  const configured = process.env.API_URL?.replace(/\/$/, '') ?? '';
  const isRemote =
    configured &&
    !configured.includes('localhost') &&
    !configured.includes('127.0.0.1');

  if (isRemote) return configured;
  if (USE_LOCAL_API) return resolveLocalApiUrl();
  return API_BASE_URL;
}

export const API_URL = resolveApiUrl();
