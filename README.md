# TWT Locator — Mobile App

React Native (Expo) client for the TWT QA Locator Tool. UI and flows match the web app: login, signup, guest mode, locator generation, analytics overview, search history, and profile.

This folder is a **standalone Git repository**, separate from the main TWT monorepo.

## Prerequisites

- Node.js 20+
- [Expo Go](https://expo.dev/go) on your phone, or Android Studio / Xcode for emulators
- Backend API running (see `../backend`)

## Setup

```bash
cd Mobile
npm install
cp .env.example .env
# Edit .env — set EXPO_PUBLIC_API_URL to your backend (use LAN IP on device)
npm start
```

Press `a` for Android, `i` for iOS, or scan the QR code with Expo Go.

## Push to a separate GitHub repo

From inside `Mobile/`:

```bash
git init
git add .
git commit -m "Initial TWT Locator mobile app"
git branch -M main
git remote add origin https://github.com/YOUR_USER/twt-locator-mobile.git
git push -u origin main
```

The parent TWT repo ignores `Mobile/` via root `.gitignore`, so the mobile app is not tracked there.

## Project structure

```
app/                 Expo Router screens
  login.tsx
  signup.tsx
  (main)/(tabs)/     Overview, Locator, History, Profile
src/
  api/               API client
  context/           Auth & theme (matches web)
  theme/             Light/dark colors (matches globals.css)
  lib/               Analytics & locator snippets
  components/        Shared UI
```

## Features (parity with web)

| Feature | Mobile |
|--------|--------|
| Email login / signup | Yes |
| Guest mode | Yes |
| Google OAuth | Opens system browser (`/auth/google`) |
| Locator generation | Yes |
| Auth section (cookies, token, site login) | Yes |
| Framework snippets (Playwright, Cypress, Selenium) | Yes |
| Analytics overview + date filters | Yes |
| Search history | Yes (signed-in users) |
| Profile edit | Yes |
| Dark / light theme | Yes |

## Notes

- **Physical device:** set `EXPO_PUBLIC_API_URL` to `http://YOUR_PC_LAN_IP:3001` (not `localhost`).
- **Android emulator:** use `http://10.0.2.2:3001` for host machine localhost.
- Copy logo images from `frontend/public/Logo/` into `assets/Logo/` and wire `Logo.tsx` if you want image logos instead of the text mark.

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run android` | Open on Android |
| `npm run ios` | Open on iOS |
