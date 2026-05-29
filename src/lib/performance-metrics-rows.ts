import type { PerformanceScanResult } from './performance-types';
import { formatBytes, formatMs } from './performance-format';

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
