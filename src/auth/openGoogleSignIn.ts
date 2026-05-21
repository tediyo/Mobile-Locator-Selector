import { Linking } from 'react-native';
import { API_URL } from '../config/api';
import { getGoogleAuthUrl } from './oauth';

export async function openGoogleSignIn(): Promise<void> {
  const url = getGoogleAuthUrl(API_URL);
  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) {
    throw new Error('Cannot open Google sign-in in the browser.');
  }
  await Linking.openURL(url);
}
