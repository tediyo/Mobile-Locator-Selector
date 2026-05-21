import type { User } from '../context/AuthContext';

/** Must match AndroidManifest intent-filter and backend mobile redirect. */
export const OAUTH_REDIRECT_URI = 'twt-locator://auth/callback';

export function getGoogleAuthUrl(apiBase: string): string {
  const base = apiBase.replace(/\/$/, '');
  const params = new URLSearchParams({
    redirect_uri: OAUTH_REDIRECT_URI,
    platform: 'mobile',
  });
  return `${base}/auth/google?${params.toString()}`;
}

function paramsFromUrl(url: string): URLSearchParams {
  const normalized = url.includes('://') ? url : `twt-locator://${url}`;
  const parsed = new URL(normalized);
  const merged = new URLSearchParams(parsed.search);
  const hash = parsed.hash.startsWith('#') ? parsed.hash.slice(1) : parsed.hash;
  if (hash) {
    new URLSearchParams(hash).forEach((value, key) => merged.set(key, value));
  }
  return merged;
}

function userFromParams(params: URLSearchParams): User | null {
  const rawUser = params.get('user');
  if (rawUser) {
    try {
      const parsed = JSON.parse(rawUser) as { id?: string | number; email?: string };
      if (parsed.id != null && parsed.email) {
        return { id: String(parsed.id), email: parsed.email };
      }
    } catch {
      /* ignore malformed JSON */
    }
  }

  const email = params.get('email');
  const id = params.get('id') ?? params.get('userId') ?? params.get('user_id');
  if (email && id != null) {
    return { id: String(id), email };
  }

  return null;
}

/** Parse `twt-locator://auth/callback?...` after Google sign-in. */
export function parseOAuthCallback(url: string): { token: string; user: User } | null {
  if (!url || !url.startsWith('twt-locator://')) return null;

  const params = paramsFromUrl(url);
  const token =
    params.get('access_token') ?? params.get('token') ?? params.get('jwt') ?? params.get('accessToken');
  if (!token) return null;

  const user = userFromParams(params);
  if (!user) return null;

  return { token, user };
}
