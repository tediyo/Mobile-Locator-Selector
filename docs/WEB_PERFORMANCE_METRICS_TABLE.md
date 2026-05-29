# Web app — Performance metrics table (parity with mobile)

Guide to implement the **Performance metrics** table on the **web dashboard**, matching the **TWT Locator mobile** app.

Use this when you already have a performance scan result on screen (`PerformanceScanResult` from `POST /performance/scan` or history) and want a dedicated **Metric | Value | Notes** table view.

---

## Overview

### UX flow (mobile parity)

1. User completes a scan → **result page** shows score, quick summary (TTFB / LCP / Load), findings, network.
2. User taps **“Performance metrics”** → navigates to a **full metrics table** screen.
3. Table has **3 columns**: **Metric**, **Value**, **Notes**.
4. **Back** returns to the result page.

On web, equivalent patterns:

- **Option A:** New route, e.g. `/dashboard/performance/metrics?scanId=…` or pass `result` in router state.
- **Option B:** Modal / drawer on the same result page (no new route).
- **Option C:** Expandable section below the score card (simplest; no navigation).

Recommended for parity with mobile: **Option A** (separate view) or **Option B** (modal).

### Important

- **No new API** — table is built from the same `PerformanceScanResult` JSON already on the client.
- **Same formatters** as PDF (`formatMs`, `formatBytes`) keep web, mobile, and PDF aligned.

---

## Data shape

Reuse the same types as mobile / backend (`frontend/lib/performance-types.ts` or equivalent):

```ts
export type PerformanceMetrics = {
  ttfbMs: number | null;
  fcpMs: number | null;
  lcpMs: number | null;
  domCompleteMs: number | null;
  loadTimeMs: number | null;
  requestCount: number;
  failedRequestCount: number;
  totalTransferBytes: number;
  domElementCount: number;
  consoleErrorCount: number;
  thirdPartyBytes: number;
  finalUrl: string;
  pageTitle: string;
  scanMode?: 'stable';
  runCount?: number;
  scoreMin?: number;
  scoreMax?: number;
};

export type PerformanceScanResult = {
  _id: string;
  url: string;
  viewport: string;
  score: number;
  metrics: PerformanceMetrics;
  findings: PerformanceFinding[];
  networkTop: NetworkResourceRow[];
  durationMs: number;
  createdAt: string;
};
```

---

## Row builder (core logic)

Mobile file: `src/lib/performance-metrics-rows.ts`

Define a row type and a single function that maps `PerformanceScanResult` → table rows.

```ts
export type PerformanceMetricRow = {
  metric: string;
  value: string;
  notes: string;
};

export function getPerformanceMetricRows(result: PerformanceScanResult): PerformanceMetricRow[] {
  const m = result.metrics;
  return [
    { metric: 'Overall score', value: `${Math.round(result.score)}/100`, notes: '0–100 lab score' },
    {
      metric: 'Score range',
      value:
        m.scoreMin != null && m.scoreMax != null
          ? `${Math.round(m.scoreMin)}–${Math.round(m.scoreMax)}`
          : '—',
      notes: 'Min–max across passes',
    },
    { metric: 'Viewport', value: result.viewport, notes: 'Desktop or mobile profile' },
    {
      metric: 'Stable scan',
      value: m.runCount ? `${m.runCount} passes` : '3 passes',
      notes: 'Median of cold runs',
    },
    { metric: 'Scan duration', value: formatMs(result.durationMs), notes: 'Server job time' },
    { metric: 'TTFB', value: formatMs(m.ttfbMs), notes: 'Time to first byte' },
    { metric: 'FCP', value: formatMs(m.fcpMs), notes: 'First contentful paint' },
    { metric: 'LCP', value: formatMs(m.lcpMs), notes: 'Largest contentful paint' },
    { metric: 'DOM complete', value: formatMs(m.domCompleteMs), notes: 'DOMContentLoaded end' },
    { metric: 'Load time', value: formatMs(m.loadTimeMs), notes: 'Window load event' },
    { metric: 'Requests', value: String(m.requestCount), notes: 'Total network requests' },
    { metric: 'Failed requests', value: String(m.failedRequestCount), notes: 'Non-success responses' },
    { metric: 'Transfer size', value: formatBytes(m.totalTransferBytes), notes: 'Total bytes transferred' },
    { metric: 'Third-party bytes', value: formatBytes(m.thirdPartyBytes), notes: 'Third-party transfer' },
    { metric: 'DOM nodes', value: String(m.domElementCount), notes: 'DOM element count' },
    { metric: 'Console errors', value: String(m.consoleErrorCount), notes: 'Console error count' },
    { metric: 'Page title', value: m.pageTitle || '—', notes: 'Document title after load' },
    { metric: 'Final URL', value: m.finalUrl || result.url, notes: 'URL after redirects' },
  ];
}
```

### Format helpers (reuse from PDF / dashboard)

```ts
export function formatMs(ms: number | null | undefined): string {
  if (ms == null || Number.isNaN(ms)) return '—';
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${Math.round(ms)} ms`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
```

Mobile uses the same helpers in `src/lib/performance-format.ts`. On web, import from `frontend/lib/performance-format.ts` (or shared package) if they already exist for the PDF report.

---

## Suggested web file map

| File | Purpose |
|------|---------|
| `frontend/lib/performance-metrics-rows.ts` | `getPerformanceMetricRows(result)` |
| `frontend/components/performance/PerformanceMetricsTable.tsx` | Presentational `<table>` |
| `frontend/app/dashboard/performance/metrics/page.tsx` | Full page (optional route) |
| `frontend/app/dashboard/performance/page.tsx` | Add **Performance metrics** button on result view |

---

## React table component (web)

Mobile: `src/components/performance/PerformanceMetricsTable.tsx`  
Web equivalent (Tailwind example):

```tsx
'use client';

import type { PerformanceMetricRow } from '@/lib/performance-metrics-rows';

type Props = { rows: PerformanceMetricRow[] };

export function PerformanceMetricsTable({ rows }: Props) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-3 py-2.5 font-semibold">Metric</th>
            <th className="px-3 py-2.5 font-semibold">Value</th>
            <th className="px-3 py-2.5 font-semibold">Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.metric} className="border-t border-border">
              <td className="px-3 py-2.5 font-medium">{row.metric}</td>
              <td className="px-3 py-2.5">{row.value}</td>
              <td className="px-3 py-2.5 text-muted-foreground">{row.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

Column width intent (mobile flex ratios):

| Column | Mobile flex | Web suggestion |
|--------|-------------|----------------|
| Metric | 1.1 | ~30% |
| Value | 1.0 | ~25% |
| Notes | 1.4 | ~45% |

---

## Result page: button + navigation

Mobile result screen (`PerformanceResultView.tsx`):

1. **Quick summary** row: TTFB, LCP, Load (3 chips).
2. **Button:** “Performance metrics” → subtitle “View full table (timing, network, DOM, scan info)”.
3. `navigation.navigate('PerformanceMetrics', { result })`.

### Web — router state example (Next.js App Router)

On the performance result page, after scan completes:

```tsx
import { useRouter } from 'next/navigation';
import { getPerformanceMetricRows } from '@/lib/performance-metrics-rows';

// Inside result UI:
<button
  type="button"
  onClick={() =>
    router.push('/dashboard/performance/metrics', { state: { result } })
    // Or: sessionStorage.setItem('perfResult', JSON.stringify(result))
  }
  className="..."
>
  <span className="font-semibold">Performance metrics</span>
  <span className="text-sm text-muted-foreground">
    View full table (timing, network, DOM, scan info)
  </span>
</button>
```

Metrics page:

```tsx
'use client';

import Link from 'next/link';
import { PerformanceMetricsTable } from '@/components/performance/PerformanceMetricsTable';
import { getPerformanceMetricRows } from '@/lib/performance-metrics-rows';
// Load `result` from router state, context, or ?id= + GET /performance/history/:id

export default function PerformanceMetricsPage({ result }: { result: PerformanceScanResult }) {
  const rows = getPerformanceMetricRows(result);
  const m = result.metrics;

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-6">
      <Link href="/dashboard/performance" className="text-sm font-medium text-primary">
        ← Back to results
      </Link>
      <h1 className="text-2xl font-bold">Performance metrics</h1>
      <p className="text-sm text-muted-foreground">{m.pageTitle || result.url}</p>
      <PerformanceMetricsTable rows={rows} />
      <p className="text-xs text-muted-foreground">
        Synthetic lab scan · {result.viewport} viewport · median of {m.runCount ?? 3} passes
      </p>
    </div>
  );
}
```

### Web — modal variant (no new route)

```tsx
const [metricsOpen, setMetricsOpen] = useState(false);
const rows = useMemo(() => getPerformanceMetricRows(result), [result]);

<button type="button" onClick={() => setMetricsOpen(true)}>Performance metrics</button>

{metricsOpen && (
  <dialog open className="...">
    <PerformanceMetricsTable rows={rows} />
    <button onClick={() => setMetricsOpen(false)}>Close</button>
  </dialog>
)}
```

---

## Full metrics list (reference)

| Metric | Source field | Notes (column) |
|--------|----------------|----------------|
| Overall score | `result.score` | 0–100 lab score |
| Score range | `metrics.scoreMin`, `metrics.scoreMax` | Min–max across passes |
| Viewport | `result.viewport` | Desktop or mobile profile |
| Stable scan | `metrics.runCount` | Median of cold runs |
| Scan duration | `result.durationMs` | Server job time |
| TTFB | `metrics.ttfbMs` | Time to first byte |
| FCP | `metrics.fcpMs` | First contentful paint |
| LCP | `metrics.lcpMs` | Largest contentful paint |
| DOM complete | `metrics.domCompleteMs` | DOMContentLoaded end |
| Load time | `metrics.loadTimeMs` | Window load event |
| Requests | `metrics.requestCount` | Total network requests |
| Failed requests | `metrics.failedRequestCount` | Non-success responses |
| Transfer size | `metrics.totalTransferBytes` | Total bytes transferred |
| Third-party bytes | `metrics.thirdPartyBytes` | Third-party transfer |
| DOM nodes | `metrics.domElementCount` | DOM element count |
| Console errors | `metrics.consoleErrorCount` | Console error count |
| Page title | `metrics.pageTitle` | Document title after load |
| Final URL | `metrics.finalUrl` or `result.url` | URL after redirects |

---

## Relation to PDF report

The PDF builder (`frontend/lib/performance-pdf.ts`) uses a **similar metrics table** via `jspdf-autotable`:

| Area | PDF | Metrics table UI |
|------|-----|------------------|
| Columns | Metric, Value, Notes | Same |
| Rows | Same core timing/network rows | Same `getPerformanceMetricRows` |
| Extra PDF-only | Charts, findings table, network table | Findings stay on result page |

**Recommendation:** Share one `getPerformanceMetricRows()` between PDF export and the metrics table page so web, mobile, and PDF never drift.

---

## Mobile reference (implemented)

| Mobile path | Role |
|-------------|------|
| `src/lib/performance-metrics-rows.ts` | Row builder |
| `src/components/performance/PerformanceMetricsTable.tsx` | Table UI |
| `src/screens/performance/PerformanceMetricsScreen.tsx` | Full screen |
| `src/screens/performance/PerformanceResultView.tsx` | Button + quick summary |
| `src/navigation/PerformanceStack.tsx` | Route `PerformanceMetrics: { result }` |

---

## Checklist for web implementation

- [ ] Add `getPerformanceMetricRows(result)` (copy from mobile or extract to shared package).
- [ ] Reuse `formatMs` / `formatBytes` from existing performance format utils.
- [ ] Add `PerformanceMetricsTable` component (`<table>` + responsive overflow).
- [ ] On scan result UI: quick summary (TTFB, LCP, Load) + **Performance metrics** button.
- [ ] Open metrics table via route, modal, or expandable panel.
- [ ] Pass the same `PerformanceScanResult` object (no refetch required).
- [ ] Footer line: synthetic lab scan · viewport · median passes.
- [ ] Optional: use same row builder in PDF export for consistency.

---

## Score range note (for UI tooltips)

If users ask about **Score range** (e.g. `4–14`):

- **Overall score** = final 0–100 grade (usually from **median** timings).
- **Score range** = min and max score across the 3 stable passes (consistency indicator).
- Wide range = unstable page between runs; narrow range = consistent.

This is display-only in the metrics table; calculation happens on the backend.
