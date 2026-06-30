import { Platform } from 'react-native';
import RNBlobUtil from 'react-native-blob-util';
import type { jsPDF } from 'jspdf';
import type {
  ActivityPoint,
  DateFilter,
  IndexedHistoryEntry,
  PiePoint,
} from './dashboard-analytics';
import { activityChartTitle } from './dashboard-analytics';

export type ExportFormat = 'csv' | 'json' | 'pdf';

export interface AnalyticsExportData {
  filter: DateFilter;
  entries: IndexedHistoryEntry[];
  stats: { totalSearches: number; totalElements: number; topType: string } | null;
  activityData: ActivityPoint[];
  pieData: PiePoint[];
}

type AutoTableFn = (doc: jsPDF, options: Record<string, unknown>) => void;
type JsPDFWithTable = jsPDF & { lastAutoTable?: { finalY: number } };

function timestamp(): string {
  return new Date().toISOString().slice(0, 10);
}

function csvEscape(value: string | number): string {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsv(data: AnalyticsExportData): string {
  const lines: string[] = [];
  lines.push('ATS Analytics Report');
  lines.push(`Period,${csvEscape(activityChartTitle(data.filter))}`);
  lines.push(`Generated,${csvEscape(new Date().toLocaleString())}`);
  lines.push('');

  lines.push('Summary');
  lines.push(`Total searches,${data.stats?.totalSearches ?? 0}`);
  lines.push(`Total elements,${data.stats?.totalElements ?? 0}`);
  lines.push(`Top locator type,${csvEscape(data.stats?.topType ?? 'None')}`);
  lines.push('');

  lines.push('Locator type breakdown');
  lines.push('Type,Count');
  for (const slice of data.pieData) {
    lines.push(`${csvEscape(slice.name)},${slice.value}`);
  }
  lines.push('');

  lines.push('History entries');
  lines.push('Date,URL,Keyword,Type,Results');
  for (const entry of data.entries) {
    lines.push(
      [
        csvEscape(new Date(entry.createdAt).toLocaleString()),
        csvEscape(entry.url),
        csvEscape(entry.keyword),
        csvEscape(entry.locatorType),
        entry.results.length,
      ].join(','),
    );
  }

  return lines.join('\n');
}

function buildJson(data: AnalyticsExportData): string {
  return JSON.stringify(
    {
      report: 'ATS Analytics',
      generatedAt: new Date().toISOString(),
      period: activityChartTitle(data.filter),
      filter: data.filter,
      summary: {
        totalSearches: data.stats?.totalSearches ?? 0,
        totalElements: data.stats?.totalElements ?? 0,
        topType: data.stats?.topType ?? 'None',
      },
      locatorTypeBreakdown: data.pieData.map((p) => ({ type: p.name, count: p.value })),
      activity: data.activityData,
      entries: data.entries.map((e) => ({
        id: e._id,
        date: e.createdAt,
        url: e.url,
        keyword: e.keyword,
        locatorType: e.locatorType,
        results: e.results.length,
      })),
    },
    null,
    2,
  );
}

function buildPdf(data: AnalyticsExportData, JsPDF: typeof jsPDF, autoTable: AutoTableFn): jsPDF {
  const doc = new JsPDF({ unit: 'mm', format: 'a4' }) as JsPDFWithTable;
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = margin + 4;

  const INK: [number, number, number] = [15, 23, 42];
  const MUTED: [number, number, number] = [100, 116, 139];
  const ACCENT: [number, number, number] = [245, 158, 11];

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...INK);
  doc.text('ATS Analytics Report', margin, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(activityChartTitle(data.filter), margin, y);
  y += 5;
  doc.text(`Generated ${new Date().toLocaleString()}`, margin, y);
  y += 8;

  // KPI summary
  const kpis: [string, string][] = [
    ['Total searches', String(data.stats?.totalSearches ?? 0)],
    ['Total elements', String(data.stats?.totalElements ?? 0)],
    ['Top type', data.stats?.topType ?? 'None'],
  ];
  const cardW = (pageW - margin * 2 - 8) / 3;
  kpis.forEach(([label, value], i) => {
    const x = margin + i * (cardW + 4);
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, y, cardW, 20, 2, 2, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(label.toUpperCase(), x + 4, y + 7);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...ACCENT);
    doc.text(value, x + 4, y + 16);
  });
  y += 28;

  // Locator type breakdown
  if (data.pieData.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...INK);
    doc.text('Locator type breakdown', margin, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [['Type', 'Count']],
      body: data.pieData.map((p) => [p.name, String(p.value)]),
      theme: 'plain',
      headStyles: { fillColor: INK, textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8, cellPadding: 2, textColor: [51, 65, 85] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: margin, right: margin },
    });
    y = (doc.lastAutoTable?.finalY ?? y) + 8;
  }

  // Activity
  if (data.activityData.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...INK);
    doc.text('Activity', margin, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [['Date', 'Searches']],
      body: data.activityData.map((a) => [a.date, String(a.searches)]),
      theme: 'plain',
      headStyles: { fillColor: INK, textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8, cellPadding: 2, textColor: [51, 65, 85] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: margin, right: margin },
    });
    y = (doc.lastAutoTable?.finalY ?? y) + 8;
  }

  // History entries
  if (data.entries.length > 0) {
    if (y > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      y = margin + 4;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...INK);
    doc.text('History entries', margin, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [['Date', 'URL', 'Keyword', 'Type', 'Results']],
      body: data.entries.map((e) => [
        new Date(e.createdAt).toLocaleDateString(),
        e.url.replace(/^https?:\/\//, ''),
        e.keyword,
        e.locatorType,
        String(e.results.length),
      ]),
      theme: 'plain',
      headStyles: { fillColor: INK, textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
      bodyStyles: { fontSize: 7, cellPadding: 1.8, overflow: 'linebreak', textColor: [51, 65, 85] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 24 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 30 },
        3: { cellWidth: 22 },
        4: { cellWidth: 16 },
      },
      margin: { left: margin, right: margin },
    });
  }

  return doc;
}

async function saveFile(fileName: string, content: string, encoding: 'utf8' | 'base64'): Promise<string> {
  const dir = Platform.OS === 'android' ? RNBlobUtil.fs.dirs.DownloadDir : RNBlobUtil.fs.dirs.DocumentDir;
  const path = `${dir}/${fileName}`;
  await RNBlobUtil.fs.writeFile(path, content, encoding);
  return path;
}

async function openFile(path: string, mime: string): Promise<void> {
  try {
    if (Platform.OS === 'android') {
      await RNBlobUtil.android.actionViewIntent(path, mime);
    } else {
      await RNBlobUtil.ios.openDocument(path);
    }
  } catch {
    // Saved even if no viewer is available (e.g. emulator).
  }
}

/** Export analytics in the requested format. Returns the saved file path. */
export async function exportAnalytics(format: ExportFormat, data: AnalyticsExportData): Promise<string> {
  const stamp = timestamp();

  if (format === 'csv') {
    const path = await saveFile(`ats-analytics-${stamp}.csv`, buildCsv(data), 'utf8');
    await openFile(path, 'text/csv');
    return path;
  }

  if (format === 'json') {
    const path = await saveFile(`ats-analytics-${stamp}.json`, buildJson(data), 'utf8');
    await openFile(path, 'application/json');
    return path;
  }

  const [{ jsPDF: JsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const autoTable = autoTableModule.default as AutoTableFn;
  const doc = buildPdf(data, JsPDF, autoTable);
  const dataUri = doc.output('datauristring');
  const base64 = typeof dataUri === 'string' ? dataUri.split(',')[1] ?? '' : '';
  if (!base64) throw new Error('Failed to encode PDF data.');
  const path = await saveFile(`ats-analytics-${stamp}.pdf`, base64, 'base64');
  await openFile(path, 'application/pdf');
  return path;
}
