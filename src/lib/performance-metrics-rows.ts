import type { PerformanceScanResult } from './performance-types';

export type MetricStatus = 'good' | 'warning' | 'critical' | 'neutral';

export type PerformanceMetricRow = {
  metric: string;
  value: string;
  notes: string;
  status: MetricStatus;
};

export function formatMs(ms: number | null | undefined): string {
  if (ms == null || Number.isNaN(ms)) return '—';
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${Math.round(ms)} ms`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** Rows for UI table and PDF — keep in sync with web frontend. */
export function buildPerformanceMetricRows(result: PerformanceScanResult): PerformanceMetricRow[] {
  const m = result.metrics;
  const score = result.score;

  const scoreStatus: MetricStatus =
    score >= 80 ? 'good' : score >= 60 ? 'warning' : 'critical';

  const ttfb = m.ttfbMs;
  const ttfbStatus: MetricStatus =
    ttfb == null ? 'neutral' : ttfb <= 600 ? 'good' : ttfb <= 1500 ? 'warning' : 'critical';

  const lcp = m.lcpMs;
  const lcpStatus: MetricStatus =
    lcp == null ? 'neutral' : lcp <= 2500 ? 'good' : lcp <= 4000 ? 'warning' : 'critical';

  const fcp = m.fcpMs;
  const fcpStatus: MetricStatus =
    fcp == null ? 'neutral' : fcp <= 1800 ? 'good' : 'warning';

  const load = m.loadTimeMs;
  const loadStatus: MetricStatus =
    load == null ? 'neutral' : load <= 5000 ? 'good' : 'warning';

  const reqStatus: MetricStatus =
    m.requestCount <= 100 ? 'good' : m.requestCount <= 150 ? 'warning' : 'critical';

  const mb = m.totalTransferBytes / (1024 * 1024);
  const transferStatus: MetricStatus =
    mb <= 3 ? 'good' : mb <= 6 ? 'warning' : 'critical';

  const domStatus: MetricStatus =
    m.domElementCount <= 1500 ? 'good' : m.domElementCount <= 3000 ? 'warning' : 'critical';

  const errStatus: MetricStatus =
    m.consoleErrorCount === 0 ? 'good' : m.consoleErrorCount > 5 ? 'critical' : 'warning';

  const scoreNotes =
    m.scoreMin != null && m.scoreMax != null && m.scoreMin !== m.scoreMax
      ? `Range ${m.scoreMin}–${m.scoreMax} across ${m.runCount ?? 3} passes`
      : `${m.runCount ?? 3}-run median`;

  return [
    { metric: 'Performance score', value: String(score), notes: scoreNotes, status: scoreStatus },
    { metric: 'TTFB', value: formatMs(m.ttfbMs), notes: 'Target < 600 ms', status: ttfbStatus },
    { metric: 'First Contentful Paint', value: formatMs(m.fcpMs), notes: 'First paint of content', status: fcpStatus },
    { metric: 'Largest Contentful Paint', value: formatMs(m.lcpMs), notes: 'Target < 2.5 s', status: lcpStatus },
    { metric: 'DOM complete', value: formatMs(m.domCompleteMs), notes: 'DOM processing finished', status: 'neutral' },
    { metric: 'Load event', value: formatMs(m.loadTimeMs), notes: 'Full load event end', status: loadStatus },
    {
      metric: 'HTTP requests',
      value: String(m.requestCount),
      notes: `${m.failedRequestCount} failed`,
      status: reqStatus,
    },
    { metric: 'Total transfer', value: formatBytes(m.totalTransferBytes), notes: 'All resources combined', status: transferStatus },
    { metric: 'Third-party transfer', value: formatBytes(m.thirdPartyBytes), notes: 'Non-first-party bytes', status: 'neutral' },
    { metric: 'DOM nodes', value: String(m.domElementCount), notes: 'Target < 1,500 nodes', status: domStatus },
    { metric: 'Console errors', value: String(m.consoleErrorCount), notes: 'Errors during scan', status: errStatus },
    { metric: 'Scan mode', value: m.scanMode ?? 'stable', notes: `${m.runCount ?? 3} passes, median aggregation`, status: 'neutral' },
    { metric: 'Viewport', value: result.viewport, notes: 'Synthetic lab profile', status: 'neutral' },
    { metric: 'Page title', value: m.pageTitle || '—', notes: 'Document title after load', status: 'neutral' },
  ];
}
