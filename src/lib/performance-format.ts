import type { PerformanceSeverity } from './performance-types';

export function formatMs(ms: number | null | undefined): string {
  if (ms == null || Number.isNaN(ms)) return '—';
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${Math.round(ms)} ms`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function scoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

export function severityColor(severity: PerformanceSeverity): string {
  if (severity === 'critical') return '#ef4444';
  if (severity === 'warning') return '#f59e0b';
  return '#3b82f6';
}

export function severityBg(severity: PerformanceSeverity): string {
  if (severity === 'critical') return 'rgba(239, 68, 68, 0.15)';
  if (severity === 'warning') return 'rgba(245, 158, 11, 0.15)';
  return 'rgba(59, 130, 246, 0.15)';
}
