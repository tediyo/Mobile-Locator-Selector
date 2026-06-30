import type { jsPDF } from 'jspdf';
import { Platform } from 'react-native';
import RNBlobUtil from 'react-native-blob-util';
import { formatBytes, formatMs } from './performance-format';
import { buildPerformanceMetricRows } from './performance-metrics-rows';
import type { PerformanceScanResult } from './performance-types';

type AutoTableFn = (doc: jsPDF, options: Record<string, unknown>) => void;

type JsPDFWithTable = jsPDF & { lastAutoTable?: { finalY: number } };

type HookData = {
  section: 'head' | 'body' | 'foot';
  column: { index: number };
  row: { index: number };
  cell: { styles: Record<string, unknown> };
};

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 3) + '...';
}

function scoreRgb(score: number): [number, number, number] {
  if (score >= 80) return [34, 197, 94];
  if (score >= 60) return [245, 158, 11];
  return [239, 68, 68];
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}

/** Donut-style score chart drawn directly with jsPDF primitives. */
function drawScoreChart(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  score: number,
  scoreMin?: number,
  scoreMax?: number,
) {
  const [r, g, b] = scoreRgb(score);
  const cx = x + w / 2;
  const cy = y + h / 2;
  const radius = Math.min(w, h) / 2 - 4;
  const lineW = 4;

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(lineW);
  doc.circle(cx, cy, radius, 'S');

  const start = -Math.PI / 2;
  const end = start + (score / 100) * Math.PI * 2;
  doc.setDrawColor(r, g, b);
  doc.setLineWidth(lineW);
  doc.setLineCap('round');
  const steps = Math.max(12, Math.ceil((score / 100) * 360 / 4));
  for (let i = 0; i < steps; i += 1) {
    const a1 = start + (i / steps) * (end - start);
    const a2 = start + ((i + 1) / steps) * (end - start);
    doc.line(
      cx + radius * Math.cos(a1),
      cy + radius * Math.sin(a1),
      cx + radius * Math.cos(a2),
      cy + radius * Math.sin(a2),
    );
  }
  doc.setLineCap('butt');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(String(score), cx, cy - 1, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Score', cx, cy + 5, { align: 'center' });
  if (scoreMin != null && scoreMax != null && scoreMin !== scoreMax) {
    doc.setFontSize(6);
    doc.text(`${scoreMin}–${scoreMax}`, cx, cy + 9, { align: 'center' });
  }
}

/** Bar chart drawn directly with jsPDF primitives. */
function drawBarChart(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  title: string,
  labels: string[],
  values: number[],
  colors: string[],
  opts?: { unit?: string },
) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(title, x, y);

  const padL = 14;
  const padR = 6;
  const padT = 12;
  const padB = 12;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;
  const maxVal = Math.max(...values, 1) * 1.15;
  const barGap = 4;
  const barW = (chartW - barGap * (labels.length - 1)) / labels.length;

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  for (let i = 0; i <= 4; i += 1) {
    const gy = y + padT + (chartH * i) / 4;
    doc.line(x + padL, gy, x + padL + chartW, gy);
    const val = maxVal * (1 - i / 4);
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(5);
    const label =
      opts?.unit === 'ms'
        ? val >= 1000
          ? `${(val / 1000).toFixed(1)}s`
          : `${Math.round(val)}ms`
        : String(Math.round(val));
    doc.text(label, x + 2, gy + 1.5);
  }

  labels.forEach((label, i) => {
    const v = values[i];
    const barH = Math.max(1, (v / maxVal) * chartH);
    const bx = x + padL + i * (barW + barGap);
    const by = y + padT + chartH - barH;
    const c = hexToRgb(colors[i] ?? '#f59e0b');
    doc.setFillColor(c[0], c[1], c[2]);
    doc.rect(bx, by, barW, barH, 'F');

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(5);
    const display =
      opts?.unit === 'ms'
        ? v >= 1000
          ? `${(v / 1000).toFixed(1)}s`
          : `${Math.round(v)}ms`
        : String(Math.round(v));
    doc.text(display, bx + barW / 2, by - 2, { align: 'center' });
    doc.text(label, bx + barW / 2, y + height - 4, { align: 'center' });
  });
}

/** Resource type distribution. */
function drawResourceTypeChart(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  rows: { resourceType: string; transferSize: number }[],
) {
  const byType = new Map<string, number>();
  for (const r of rows) {
    byType.set(r.resourceType, (byType.get(r.resourceType) ?? 0) + r.transferSize);
  }
  const labels = [...byType.keys()].slice(0, 8);
  const values = labels.map((l) => byType.get(l) ?? 0);
  const palette = ['#f59e0b', '#3b82f6', '#22c55e', '#a855f7', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];
  drawBarChart(doc, x, y, width, height, 'Transfer by resource type (bytes)', labels, values, palette);
}

type RGB = [number, number, number];

const INK: RGB = [15, 23, 42];
const SLATE: RGB = [71, 85, 105];
const MUTED: RGB = [148, 163, 184];
const BORDER: RGB = [226, 232, 240];
const PANEL: RGB = [248, 250, 252];
const AMBER: RGB = [245, 158, 11];

const GOOD: RGB = [22, 163, 74];
const WARN: RGB = [180, 83, 9];
const CRIT: RGB = [220, 38, 38];

function statusColor(status: string): RGB {
  switch (status) {
    case 'good':
      return GOOD;
    case 'warning':
      return WARN;
    case 'critical':
      return CRIT;
    default:
      return SLATE;
  }
}

function thresholdColor(value: number | null | undefined, good: number, warn: number): RGB {
  if (value == null || Number.isNaN(value)) return SLATE;
  if (value <= good) return GOOD;
  if (value <= warn) return WARN;
  return CRIT;
}

function gradeFor(score: number): { label: string; verdict: string } {
  if (score >= 80) {
    return {
      label: 'Good',
      verdict: 'This page delivers a strong performance experience, with key metrics inside their recommended targets.',
    };
  }
  if (score >= 60) {
    return {
      label: 'Needs improvement',
      verdict: 'Performance is acceptable, but several metrics exceed their recommended thresholds and are worth optimising.',
    };
  }
  return {
    label: 'Poor',
    verdict: 'Performance issues are materially affecting the user experience and should be prioritised for remediation.',
  };
}

function sanitizeFilePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function extractHostname(url: string): string {
  try {
    const match = url.match(/^https?:\/\/([^/?#]+)/);
    return match?.[1] ?? 'site';
  } catch {
    return 'site';
  }
}

function buildPerformancePdf(
  result: PerformanceScanResult,
  jsPDFCtor: typeof import('jspdf').jsPDF,
  autoTable: AutoTableFn,
): jsPDF {
  const m = result.metrics;
  const doc = new jsPDFCtor({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentW = pageW - margin * 2;

  const fill = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
  const stroke = (c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);
  const ink = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
  const lastY = () => (doc as JsPDFWithTable).lastAutoTable?.finalY ?? margin;

  const ensureSpace = (yy: number, needed: number): number => {
    if (yy + needed > pageH - 16) {
      doc.addPage();
      return margin + 4;
    }
    return yy;
  };

  const sectionTitle = (yy: number, text: string): number => {
    fill(AMBER);
    doc.rect(margin, yy - 3.1, 1.6, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    ink(INK);
    doc.text(text, margin + 4, yy);
    return yy + 5.5;
  };

  const drawChip = (x: number, yy: number, text: string, bg: RGB, fg: RGB): number => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    const w = doc.getTextWidth(text) + 6;
    fill(bg);
    doc.roundedRect(x, yy - 3.7, w, 5.6, 1.3, 1.3, 'F');
    ink(fg);
    doc.text(text, x + 3, yy);
    return x + w + 3;
  };

  const generatedAt = new Date();
  const scanDate = new Date(result.createdAt);

  // ── Header band ──
  fill(INK);
  doc.rect(0, 0, pageW, 26, 'F');
  fill(AMBER);
  doc.rect(0, 26, pageW, 1.4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  ink(AMBER);
  doc.text('ATS', margin, 13);
  const brandW = doc.getTextWidth('ATS');
  doc.setTextColor(255, 255, 255);
  doc.text('  Performance Report', margin + brandW, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Generated ${generatedAt.toLocaleString()}`, pageW - margin, 12, { align: 'right' });
  const scanId = result._id ? `#${result._id.slice(-8).toUpperCase()}` : '—';
  doc.text(`Scan ${scanId}`, pageW - margin, 18, { align: 'right' });

  let y = 37;

  // ── Page identity ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  ink(INK);
  const titleLines = doc.splitTextToSize(m.pageTitle || 'Page scan', contentW) as string[];
  doc.text(titleLines[0], margin, y);
  y += 5.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  ink(SLATE);
  const urlLines = (doc.splitTextToSize(m.finalUrl || result.url, contentW) as string[]).slice(0, 2);
  doc.text(urlLines, margin, y);
  y += urlLines.length * 4 + 2.5;

  doc.setFontSize(8);
  ink(MUTED);
  doc.text(
    `Scanned ${scanDate.toLocaleString()}    ·    Viewport ${result.viewport}    ·    ${m.runCount ?? 3}-run median    ·    Duration ${(result.durationMs / 1000).toFixed(0)}s`,
    margin,
    y,
  );
  y += 7;

  // ── Executive summary panel ──
  const panelH = 44;
  stroke(BORDER);
  fill(PANEL);
  doc.roundedRect(margin, y, contentW, panelH, 2.5, 2.5, 'FD');

  drawScoreChart(doc, margin + 4, y + 5, 34, 34, result.score, m.scoreMin, m.scoreMax);

  const grade = gradeFor(result.score);
  const scoreCol = scoreRgb(result.score);
  const tx = margin + 46;
  let ty = y + 11;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  ink(scoreCol);
  doc.text(`${grade.label} · ${result.score}/100`, tx, ty);
  ty += 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  ink(SLATE);
  const verdictLines = doc.splitTextToSize(grade.verdict, contentW - 46 - 6) as string[];
  doc.text(verdictLines, tx, ty);

  const crit = result.findings.filter((f) => f.severity === 'critical').length;
  const warn = result.findings.filter((f) => f.severity === 'warning').length;
  const info = result.findings.filter((f) => f.severity === 'info').length;
  const chipY = y + panelH - 7;
  let chipX = tx;
  chipX = drawChip(chipX, chipY, `${crit} Critical`, [254, 226, 226], [185, 28, 28]);
  chipX = drawChip(chipX, chipY, `${warn} Warning`, [254, 243, 199], [180, 83, 9]);
  drawChip(chipX, chipY, `${info} Info`, [224, 231, 255], [55, 48, 163]);

  y += panelH + 8;

  // ── KPI tiles ──
  const kpis: { label: string; value: string; hint: string; color: RGB }[] = [
    { label: 'TTFB', value: formatMs(m.ttfbMs), hint: 'Target < 600 ms', color: thresholdColor(m.ttfbMs, 600, 1500) },
    { label: 'FCP', value: formatMs(m.fcpMs), hint: 'First content', color: thresholdColor(m.fcpMs, 1800, 3000) },
    { label: 'LCP', value: formatMs(m.lcpMs), hint: 'Target < 2.5 s', color: thresholdColor(m.lcpMs, 2500, 4000) },
    { label: 'LOAD', value: formatMs(m.loadTimeMs), hint: 'Load event', color: thresholdColor(m.loadTimeMs, 5000, 8000) },
    { label: 'REQUESTS', value: String(m.requestCount), hint: `${m.failedRequestCount} failed`, color: thresholdColor(m.requestCount, 100, 150) },
    { label: 'TRANSFER', value: formatBytes(m.totalTransferBytes), hint: `${m.domElementCount} DOM nodes`, color: thresholdColor(m.totalTransferBytes, 3 * 1024 * 1024, 6 * 1024 * 1024) },
  ];
  const gap = 3;
  const tileW = (contentW - gap * (kpis.length - 1)) / kpis.length;
  const tileH = 19;
  kpis.forEach((k, i) => {
    const kx = margin + i * (tileW + gap);
    stroke(BORDER);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(kx, y, tileW, tileH, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.3);
    ink(MUTED);
    doc.text(k.label, kx + 3, y + 5);
    doc.setFontSize(11);
    ink(k.color);
    doc.text(k.value, kx + 3, y + 11.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.8);
    ink(MUTED);
    const hint = (doc.splitTextToSize(k.hint, tileW - 5) as string[])[0] ?? '';
    doc.text(hint, kx + 3, y + 16);
  });
  y += tileH + 10;

  // ── Core timing chart ──
  y = ensureSpace(y, 60);
  drawBarChart(
    doc,
    margin,
    y,
    contentW,
    52,
    'Core timing metrics (median)',
    ['TTFB', 'FCP', 'LCP', 'Load'],
    [m.ttfbMs ?? 0, m.fcpMs ?? 0, m.lcpMs ?? 0, m.loadTimeMs ?? 0],
    ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7'],
    { unit: 'ms' },
  );
  y += 58;

  // ── Detailed metrics table ──
  const rows = buildPerformanceMetricRows(result);
  y = ensureSpace(y, 40);
  y = sectionTitle(y, 'Detailed performance metrics');
  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Value', 'Assessment']],
    body: rows.map((r) => [r.metric, r.value, r.notes]),
    theme: 'plain',
    headStyles: { fillColor: INK, textColor: 255, fontStyle: 'bold', fontSize: 8, cellPadding: 2.4 },
    bodyStyles: { fontSize: 8, cellPadding: 2.2, textColor: SLATE },
    alternateRowStyles: { fillColor: PANEL },
    columnStyles: {
      0: { cellWidth: 64, fontStyle: 'bold', textColor: INK },
      1: { cellWidth: 32 },
      2: { cellWidth: 'auto' },
    },
    didParseCell: (data: HookData) => {
      if (data.section === 'body' && data.column.index === 1) {
        const st = rows[data.row.index]?.status ?? 'neutral';
        data.cell.styles.textColor = statusColor(st);
        data.cell.styles.fontStyle = 'bold';
      }
    },
    margin: { left: margin, right: margin },
  });
  y = lastY() + 5.5;

  // ── Status legend ──
  const legend: { t: string; c: RGB }[] = [
    { t: 'Good', c: GOOD },
    { t: 'Needs attention', c: WARN },
    { t: 'Critical', c: CRIT },
  ];
  let lx = margin;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  legend.forEach((lg) => {
    fill(lg.c);
    doc.circle(lx + 1, y - 1, 1, 'F');
    ink(SLATE);
    doc.text(lg.t, lx + 3.5, y);
    lx += doc.getTextWidth(lg.t) + 12;
  });
  y += 9;

  // ── Resource type chart ──
  if (result.networkTop.length > 0) {
    const resourceChartY = ensureSpace(y, 58);
    drawResourceTypeChart(doc, margin, resourceChartY, contentW, 52, result.networkTop);
    y = resourceChartY + 58;
  }

  // ── Findings ──
  if (result.findings.length > 0) {
    y = ensureSpace(y, 30);
    y = sectionTitle(y, `Bottleneck findings (${result.findings.length})`);
    autoTable(doc, {
      startY: y,
      head: [['Severity', 'Category', 'Issue', 'Details']],
      body: result.findings.map((f) => [
        f.severity.toUpperCase(),
        f.category,
        f.title,
        truncate(f.message + (f.evidence?.length ? ` | ${f.evidence.join('; ')}` : ''), 130),
      ]),
      theme: 'striped',
      headStyles: { fillColor: INK, textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak', textColor: SLATE },
      alternateRowStyles: { fillColor: PANEL },
      columnStyles: {
        0: { cellWidth: 20, fontStyle: 'bold' },
        1: { cellWidth: 24 },
        2: { cellWidth: 42, textColor: INK, fontStyle: 'bold' },
        3: { cellWidth: 'auto' },
      },
      didParseCell: (data: HookData) => {
        if (data.section === 'body' && data.column.index === 0) {
          const sev = result.findings[data.row.index]?.severity;
          data.cell.styles.textColor =
            sev === 'critical' ? CRIT : sev === 'warning' ? WARN : [55, 48, 163];
        }
      },
      margin: { left: margin, right: margin },
    });
    y = lastY() + 8;
  }

  // ── Network resources ──
  if (result.networkTop.length > 0) {
    doc.addPage();
    y = margin + 4;
    y = sectionTitle(y, 'Slowest network resources');
    autoTable(doc, {
      startY: y,
      head: [['URL', 'Type', 'Status', 'Duration', 'Size']],
      body: result.networkTop.map((r) => [
        truncate(r.url, 78),
        r.resourceType,
        String(r.status),
        formatMs(r.durationMs),
        formatBytes(r.transferSize),
      ]),
      theme: 'plain',
      headStyles: { fillColor: INK, textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
      bodyStyles: { fontSize: 6.8, cellPadding: 1.8, overflow: 'linebreak', textColor: SLATE },
      alternateRowStyles: { fillColor: PANEL },
      columnStyles: {
        0: { cellWidth: 78, textColor: INK },
        1: { cellWidth: 20 },
        2: { cellWidth: 16 },
        3: { cellWidth: 22 },
        4: { cellWidth: 'auto' },
      },
      margin: { left: margin, right: margin },
    });
  }

  // ── Footer on every page ──
  const hostname = extractHostname(result.url);

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    stroke(BORDER);
    doc.setLineWidth(0.2);
    doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    ink(MUTED);
    doc.text(`ATS · Performance Report for ${hostname}`, margin, pageH - 7);
    doc.text(`Page ${i} of ${pageCount}`, pageW - margin, pageH - 7, { align: 'right' });
  }

  return doc;
}

async function savePdfFile(doc: jsPDF, result: PerformanceScanResult): Promise<string> {
  const created = new Date(result.createdAt || Date.now()).toISOString().slice(0, 10);
  const host = sanitizeFilePart(extractHostname(result.url)) || 'report';

  const fileName = `performance-report-${host}-${created}.pdf`;
  const dataUri = doc.output('datauristring');
  const base64 = typeof dataUri === 'string' ? dataUri.split(',')[1] ?? '' : '';
  if (!base64) {
    throw new Error('Failed to encode PDF data.');
  }
  const dir =
    Platform.OS === 'android' ? RNBlobUtil.fs.dirs.DownloadDir : RNBlobUtil.fs.dirs.DocumentDir;
  const path = `${dir}/${fileName}`;
  await RNBlobUtil.fs.writeFile(path, base64, 'base64');
  return path;
}

async function openPdfFile(path: string): Promise<void> {
  if (Platform.OS === 'android') {
    await RNBlobUtil.android.actionViewIntent(path, 'application/pdf');
    return;
  }
  await RNBlobUtil.ios.openDocument(path);
}

/** Build PDF with tables + charts, save to device, open in PDF viewer. */
export async function downloadPerformanceReportPdf(result: PerformanceScanResult): Promise<string> {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const autoTable = autoTableModule.default as AutoTableFn;
  const doc = buildPerformancePdf(result, jsPDF, autoTable);
  const path = await savePdfFile(doc, result);
  try {
    await openPdfFile(path);
  } catch {
    // File is saved even if no viewer is available (e.g. emulator).
  }
  return path;
}
