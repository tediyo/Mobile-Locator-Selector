import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'TWT Locator',
  slug: 'twt-locator',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'twt-locator',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#000000',
  },
  ios: { supportsTablet: true, bundleIdentifier: 'com.twt.locator' },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#000000',
    },
    package: 'com.twt.locator',
    edgeToEdgeEnabled: true,
  },
  web: { bundler: 'metro', output: 'static', favicon: './assets/images/favicon.png' },
  plugins: ['expo-router', '@react-native-community/datetimepicker'],
  experiments: { typedRoutes: true },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001',
    eas: { projectId: 'your-eas-project-id' },
  },
};

export default config;
