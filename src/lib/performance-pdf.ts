import { Platform } from 'react-native';
import { generatePDF } from 'react-native-html-to-pdf';
import type { PerformanceScanResult } from './performance-types';
import { formatBytes, formatMs } from './performance-format';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function scoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

function sanitizeFilePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function buildChartSvg(metrics: Array<{ label: string; value: number }>): string {
  const max = Math.max(...metrics.map((m) => m.value), 1);
  const barWidth = 90;
  const gap = 30;
  const chartHeight = 220;
  const width = metrics.length * (barWidth + gap) + gap;
  const height = 300;

  const bars = metrics
    .map((metric, index) => {
      const barHeight = Math.max(6, Math.round((metric.value / max) * chartHeight));
      const x = gap + index * (barWidth + gap);
      const y = chartHeight - barHeight + 20;
      return `
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="6" fill="#2563eb" />
        <text x="${x + barWidth / 2}" y="${y - 8}" text-anchor="middle" font-size="12" fill="#334155">${Math.round(metric.value)} ms</text>
        <text x="${x + barWidth / 2}" y="${chartHeight + 42}" text-anchor="middle" font-size="12" fill="#0f172a">${escapeHtml(metric.label)}</text>
      `;
    })
    .join('');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff" />
      <line x1="${gap}" y1="${chartHeight + 20}" x2="${width - gap}" y2="${chartHeight + 20}" stroke="#94a3b8" stroke-width="1" />
      ${bars}
    </svg>
  `;
}

function buildHtml(result: PerformanceScanResult): string {
  const m = result.metrics;
  const chartMetrics = [
    { label: 'TTFB', value: m.ttfbMs ?? 0 },
    { label: 'FCP', value: m.fcpMs ?? 0 },
    { label: 'LCP', value: m.lcpMs ?? 0 },
    { label: 'Load', value: m.loadTimeMs ?? 0 },
  ];
  const chartSvg = buildChartSvg(chartMetrics);
  const findingsRows = result.findings
    .slice(0, 20)
    .map(
      (f) => `
    <tr>
      <td>${escapeHtml(f.severity)}</td>
      <td>${escapeHtml(f.category)}</td>
      <td>${escapeHtml(f.title)}</td>
      <td>${escapeHtml(f.message)}</td>
    </tr>`,
    )
    .join('');

  return `
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: Arial, sans-serif; color: #0f172a; padding: 24px; }
        h1 { font-size: 24px; margin: 0 0 6px; }
        h2 { font-size: 16px; margin: 22px 0 10px; }
        .meta { color: #475569; font-size: 12px; margin-bottom: 14px; }
        .score { display: inline-block; padding: 6px 10px; border-radius: 999px; color: #fff; background: ${scoreColor(result.score)}; font-weight: bold; }
        table { border-collapse: collapse; width: 100%; margin-top: 6px; font-size: 12px; }
        th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; vertical-align: top; }
        th { background: #f1f5f9; }
        .muted { color: #64748b; }
        .section { margin-top: 18px; }
      </style>
    </head>
    <body>
      <h1>Performance Scan Report</h1>
      <div class="meta">
        <div><strong>URL:</strong> ${escapeHtml(result.url)}</div>
        <div><strong>Final URL:</strong> ${escapeHtml(m.finalUrl || result.url)}</div>
        <div><strong>Viewport:</strong> ${escapeHtml(result.viewport)} | <strong>Date:</strong> ${escapeHtml(new Date(result.createdAt).toLocaleString())}</div>
      </div>
      <div class="score">Score ${Math.round(result.score)}/100</div>

      <div class="section">
        <h2>Metrics Table</h2>
        <table>
          <tr><th>Metric</th><th>Value</th></tr>
          <tr><td>TTFB</td><td>${escapeHtml(formatMs(m.ttfbMs))}</td></tr>
          <tr><td>FCP</td><td>${escapeHtml(formatMs(m.fcpMs))}</td></tr>
          <tr><td>LCP</td><td>${escapeHtml(formatMs(m.lcpMs))}</td></tr>
          <tr><td>DOM Complete</td><td>${escapeHtml(formatMs(m.domCompleteMs))}</td></tr>
          <tr><td>Load Time</td><td>${escapeHtml(formatMs(m.loadTimeMs))}</td></tr>
          <tr><td>Requests</td><td>${m.requestCount}</td></tr>
          <tr><td>Failed Requests</td><td>${m.failedRequestCount}</td></tr>
          <tr><td>Total Transfer</td><td>${escapeHtml(formatBytes(m.totalTransferBytes))}</td></tr>
          <tr><td>Third-party Bytes</td><td>${escapeHtml(formatBytes(m.thirdPartyBytes))}</td></tr>
          <tr><td>DOM Nodes</td><td>${m.domElementCount}</td></tr>
          <tr><td>Console Errors</td><td>${m.consoleErrorCount}</td></tr>
        </table>
      </div>

      <div class="section">
        <h2>Chart (Timing Metrics)</h2>
        ${chartSvg}
      </div>

      <div class="section">
        <h2>Findings (${result.findings.length})</h2>
        ${
          result.findings.length
            ? `<table>
                <tr><th>Severity</th><th>Category</th><th>Title</th><th>Message</th></tr>
                ${findingsRows}
              </table>`
            : '<div class="muted">No findings.</div>'
        }
      </div>
    </body>
  </html>
  `;
}

export async function generatePerformancePdf(result: PerformanceScanResult): Promise<string> {
  const created = new Date(result.createdAt || Date.now()).toISOString().slice(0, 10);
  let host = 'report';
  try {
    const parsed = new URL(result.url);
    host = sanitizeFilePart(parsed.hostname || host);
  } catch {
    host = sanitizeFilePart(result.url) || host;
  }

  const fileName = `performance-${host}-${created}`;
  const pdf = await generatePDF({
    html: buildHtml(result),
    fileName,
    directory: Platform.OS === 'android' ? 'Download' : 'Documents',
  });

  if (!pdf.filePath) {
    throw new Error('Could not generate PDF file.');
  }

  return pdf.filePath;
}
