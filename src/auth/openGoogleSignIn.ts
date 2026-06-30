import { Linking } from 'react-native';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import { API_URL } from '../config/api';
import type { User } from '../context/AuthContext';
import { getGoogleAuthUrl, OAUTH_REDIRECT_URI, parseOAuthCallback } from './oauth';

export type GoogleSignInResult = { token: string; user: User } | null;

/**
 * Opens Google OAuth. When the backend redirects to `twt-locator://auth/callback`,
 * returns token + user and closes the browser tab automatically.
 * Note: the redirect URI remains `twt-locator://` for OAuth compatibility.
 */
export async function openGoogleSignIn(): Promise<GoogleSignInResult> {
  const url = getGoogleAuthUrl(API_URL);

  if (await InAppBrowser.isAvailable()) {
    try {
      const result = await InAppBrowser.openAuth(url, OAUTH_REDIRECT_URI, {
        showTitle: false,
        enableUrlBarHiding: true,
        enableDefaultShare: false,
        ephemeralWebSession: false,
      });

      if (result.type === 'success' && result.url) {
        const payload = parseOAuthCallback(result.url);
        if (payload) return payload;
        throw new Error(
          'Google sign-in succeeded but the app could not read the token. Check backend redirect format.',
        );
      }

      if (result.type === 'cancel' || result.type === 'dismiss') {
        return null;
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('redirect format')) {
        throw err;
      }
      // Fall through to system browser + deep link listener
    }
  }

  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) {
    throw new Error('Cannot open Google sign-in in the browser.');
  }
  await Linking.openURL(url);
  return null;
}
