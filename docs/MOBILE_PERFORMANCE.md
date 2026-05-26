# Mobile app — Performance API integration

Integration guide for the **TWT Locator** mobile app using the shared NestJS backend.

## Overview

Performance scanning runs **on the server** via Playwright. The mobile app:

1. `POST /performance/scan` with URL + options  
2. Shows loading (~**1–2 minutes**, 180s client timeout)  
3. Displays score, metrics, findings, slow resources  
4. Saves history when logged in (`GET/DELETE /performance/history`)

Each scan: **3 cold passes**, **median** metrics, **0–100 score**.

## Base URL

Production: `https://twt-pktm.onrender.com` (see `src/config/env.ts`).

Auth: `Authorization: Bearer <access_token>` (optional for scan; required for history).

## Endpoints (implemented in `src/api/performance.ts`)

| Method | Path | Auth |
|--------|------|------|
| POST | `/performance/scan` | Optional |
| GET | `/performance/history` | Required |
| GET | `/performance/history/:id` | Required |
| DELETE | `/performance/history/:id` | Required |
| DELETE | `/performance/history` | Required |

### Scan body

```json
{
  "url": "https://www.example.com",
  "viewport": "desktop",
  "cookies": "session=abc",
  "authToken": "target-site-jwt"
}
```

Default viewport: **`desktop`** (1920×1080), same as the web app. Choose **mobile** (390×844) only when you want a mobile lab profile — scores will differ from desktop.

## App UI

- **Perf** tab → scan form, viewport, target-site auth  
- **Results** → score ring, metrics, findings, network top, share/delete  
- **History** → list (signed-in users)

## Code map

| Path | Purpose |
|------|---------|
| `src/lib/performance-types.ts` | TypeScript types |
| `src/lib/performance-format.ts` | `formatMs`, `formatBytes`, colors |
| `src/api/performance.ts` | API client (180s scan timeout) |
| `src/navigation/PerformanceStack.tsx` | Stack navigator |
| `src/screens/performance/*` | Scan, result, history |

## UX notes

- Lab scan label shown (not device network speed).  
- Guest scans work but `_id` may be empty and history is not saved.  
- First request after Render cold start may add extra delay before scan starts.
