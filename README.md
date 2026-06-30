# ATS Locator — Mobile App

React Native (bare) client for the ATS QA Locator Tool. No Expo — runs as a standard native Android app via USB or Android Studio.

## Prerequisites

- Node.js 20+
- Android Studio + SDK (`ANDROID_HOME` set, `platform-tools` on `PATH`)
- Physical device with USB debugging, or an Android emulator
- Backend API reachable (default: production on Render)

## Setup

```bash
npm install
```

API base URL is `https://twt-pktm.onrender.com` in `src/config/env.ts` (`API_BASE_URL`). For a local backend, set `USE_LOCAL_API = true` and `DEV_MACHINE_HOST` to your PC’s LAN IP.

## Run on USB device

1. Connect phone, enable USB debugging, verify: `adb devices`
2. Terminal 1: `npm start`
3. Terminal 2: `npm run android`

Or open `android/` in Android Studio, start Metro (`npm start`), then Run on your device.

## API URL

| Target | URL |
|--------|-----|
| Default (production) | `https://twt-pktm.onrender.com` — `API_BASE_URL` in `src/config/env.ts` |
| Local backend | Set `USE_LOCAL_API = true`, then `http://YOUR_PC_IP:3001` or emulator `10.0.2.2` |

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Metro bundler |
| `npm run start:reset` | Metro with cache cleared |
| `npm run android` | Build & install on device/emulator |
| `npm run android:apk` | Debug APK (`android/app/build/outputs/apk/debug/`) |

## Release build (smaller APK)

Release builds use R8 minify + resource shrinking. From `android/`:

```powershell
.\gradlew.bat assembleRelease
```

APK: `android/app/build/outputs/apk/release/app-release.apk`

After dependency changes, run `npm install` and rebuild native (`npm run android`).

## Bundle optimizations

- **Removed** `react-native-reanimated` / `react-native-worklets` (not used in UI code).
- **Lazy-loaded** PDF libs (`jspdf`, `jspdf-autotable`) only when downloading a report.
- **Icon fonts** — only FontAwesome is packaged via `fonts.gradle` (required for tab/header icons).
- **Release** — ProGuard + `shrinkResources` enabled.

## Project structure

```
App.tsx                 Root component
index.js                Entry point
src/
  navigation/           React Navigation (stack + tabs)
  screens/              Login, tabs, etc.
  api/                  API client
  context/              Auth & theme
  components/           Shared UI
android/                Native Android project (open in Android Studio)
```
