import Constants from 'expo-constants';

/** Backend API base URL — set EXPO_PUBLIC_API_URL in .env */
export const API_URL =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ||
  process.env.EXPO_PUBLIC_API_URL ||
  'http://localhost:3001';
