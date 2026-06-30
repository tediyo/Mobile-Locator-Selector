import { useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { PerformanceMetricsTable } from '../../components/performance/PerformanceMetricsTable';
import { PerformanceResourcesTable } from '../../components/performance/PerformanceResourcesTable';
import { ScoreRing } from '../../components/performance/ScoreRing';
import { Card } from '../../components/ui/Card';
import { useTheme } from '../../context/ThemeContext';
import {
    formatBytes,
    formatMs,
    severityBg,
    severityColor,
} from '../../lib/performance-format';
import { buildPerformanceMetricRows } from '../../lib/performance-metrics-rows';
import type { PerformanceScanResult } from '../../lib/performance-types';

type Props = {
  result: PerformanceScanResult;
  onDelete?: () => void;
  onRerun?: () => void;
};

export function PerformanceResultView({ result, onDelete, onRerun }: Props) {
  const { colors } = useTheme();
  const m = result.metrics;
  const [downloading, setDownloading] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);

  const shareReport = async () => {
    const lines = [
      `Performance: ${result.score}/100`,
      result.url,
      `TTFB ${formatMs(m.ttfbMs)} · LCP ${formatMs(m.lcpMs)} · Load ${formatMs(m.loadTimeMs)}`,
      `${result.findings.length} findings`,
    ];
    await Share.share({ message: lines.join('\n') });
  };

  const downloadReport = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const { downloadPerformanceReportPdf } = await import('../../lib/performance-pdf');
      const path = await downloadPerformanceReportPdf(result);
      Alert.alert('Report saved', `PDF saved and opened:\n${path}`);
    } catch (err) {
      Alert.alert(
        'Download failed',
        err instanceof Error ? err.message : 'Could not generate the PDF report.',
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <View style={{ gap: 16 }}>
      {result.authWarning && (
        <Card style={{ gap: 6, borderLeftColor: colors.accent, borderLeftWidth: 4 }}>
          <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 14 }}>
            {result.authWarning.warning}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 12 }} numberOfLines={2}>
            {result.authWarning.redirectedTo}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 13 }}>
            {result.authWarning.hint}
          </Text>
          {result.authWarning.loginError ? (
            <Text style={{ color: colors.error, fontSize: 13 }}>
              {result.authWarning.loginError}
            </Text>
          ) : null}
        </Card>
      )}

      <Card style={{ paddingVertical: 16, gap: 16 }}>
        <View style={styles.headerRow}>
          <View style={styles.headerScore}>
            <ScoreRing score={result.score} scoreMin={m.scoreMin} scoreMax={m.scoreMax} />
          </View>
          <View style={styles.headerMeta}>
            <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
              {m.pageTitle || result.url}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12 }} numberOfLines={2}>
              {m.finalUrl || result.url}
            </Text>
            <View style={[styles.metaRow, { marginTop: 8 }]}>
              <Text style={[styles.pill, { color: colors.muted, borderColor: colors.cardBorder }]}>
                Viewport: {result.viewport}
              </Text>
              {m.runCount ? (
                <Text style={[styles.pill, { color: colors.muted, borderColor: colors.cardBorder }]}>
                  {m.runCount} passes · median
                </Text>
              ) : null}
              {m.scoreMin != null && m.scoreMax != null && m.scoreMin !== m.scoreMax ? (
                <Text style={[styles.pill, { color: colors.muted, borderColor: colors.cardBorder }]}>
                  Score range {Math.round(m.scoreMin)}–{Math.round(m.scoreMax)}
                </Text>
              ) : null}
              <Text style={[styles.pill, { color: colors.muted, borderColor: colors.cardBorder }]}>
                {(result.durationMs / 1000).toFixed(0)}s total
              </Text>
            </View>
            <Text style={{ color: colors.muted, fontSize: 11, marginTop: 6 }}>
              Synthetic lab scan (server-side). Not your device network speed.
            </Text>
          </View>
        </View>
      </Card>

      <Card style={{ gap: 12 }}>
        <Text style={[styles.section, { color: colors.foreground }]}>Quick summary</Text>
        <View style={styles.metricsGrid}>
          <MetricTile label="TTFB" value={formatMs(m.ttfbMs)} hint="Target < 600ms" colors={colors} />
          <MetricTile label="FCP" value={formatMs(m.fcpMs)} hint="First contentful paint" colors={colors} />
          <MetricTile label="LCP" value={formatMs(m.lcpMs)} hint="Target < 2.5s" colors={colors} />
          <MetricTile label="Load" value={formatMs(m.loadTimeMs)} hint="Load event end" colors={colors} />
          <MetricTile label="Requests" value={String(m.requestCount)} hint={`${m.failedRequestCount} failed`} colors={colors} />
          <MetricTile label="Transfer" value={formatBytes(m.totalTransferBytes)} hint={`${m.domElementCount} DOM nodes`} colors={colors} />
        </View>

        <Pressable
          onPress={() => setShowMetrics(!showMetrics)}
          style={[
            styles.metricsBtn,
            {
              borderColor: showMetrics ? colors.accent : colors.cardBorder,
              backgroundColor: showMetrics ? colors.surface : colors.surface,
            },
          ]}
        >
          <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 15 }}>
            {showMetrics ? 'Hide metrics table' : 'Performance metrics'}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
            {showMetrics ? 'View full table (timing, network, DOM, scan info)' : 'Tap to view detailed metrics'}
          </Text>
        </Pressable>

        {showMetrics ? (
          <View style={{ marginTop: 8 }}>
            <Text style={[styles.section, { color: colors.foreground, fontSize: 13 }]}>Detailed metrics</Text>
            <PerformanceMetricsTable rows={buildPerformanceMetricRows(result)} />
          </View>
        ) : null}
      </Card>

      <Card style={{ gap: 10 }}>
        <Text style={[styles.section, { color: colors.foreground }]}>
          Findings ({result.findings.length})
        </Text>
        {result.findings.length === 0 ? (
          <Text style={{ color: colors.muted }}>No findings for this run.</Text>
        ) : (
          result.findings.map((f, i) => (
            <View
              key={`${f.code}-${i}`}
              style={[styles.finding, { backgroundColor: severityBg(f.severity), borderColor: colors.cardBorder }]}
            >
              <View style={styles.findingHead}>
                <Text style={[styles.sev, { color: severityColor(f.severity) }]}>{f.severity}</Text>
                <Text style={{ color: colors.muted, fontSize: 10, textTransform: 'uppercase' }}>{f.category}</Text>
              </View>
              <Text style={{ color: colors.foreground, fontWeight: '600' }}>{f.title}</Text>
              <Text style={{ color: colors.muted, fontSize: 13 }}>{f.message}</Text>
              {f.evidence?.map((e, j) => (
                <Text key={j} style={{ color: colors.mutedStrong, fontSize: 11, fontFamily: 'monospace' }}>
                  {e}
                </Text>
              ))}
            </View>
          ))
        )}
      </Card>

      {result.networkTop.length > 0 ? (
        <Card style={{ gap: 10 }}>
          <Text style={[styles.section, { color: colors.foreground }]}>Slowest resources</Text>
          <PerformanceResourcesTable rows={result.networkTop} />
        </Card>
      ) : null}

      <View style={styles.actions}>
        {onRerun ? (
          <Pressable onPress={onRerun} style={[styles.btn, { borderColor: colors.accent }]}>
            <Text style={{ color: colors.accent, fontWeight: '600' }}>Re-run</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={shareReport} style={[styles.btn, { borderColor: colors.cardBorder }]}>
          <Text style={{ color: colors.foreground, fontWeight: '600' }}>Share</Text>
        </Pressable>
        <Pressable
          onPress={downloadReport}
          disabled={downloading}
          style={[styles.btn, { borderColor: colors.accent, opacity: downloading ? 0.7 : 1 }]}
        >
          <Text style={{ color: colors.accent, fontWeight: '600' }}>
            {downloading ? 'Generating…' : 'Download report'}
          </Text>
        </Pressable>
        {onDelete && result._id ? (
          <Pressable onPress={onDelete} style={[styles.btn, { borderColor: colors.error }]}>
            <Text style={{ color: colors.error, fontWeight: '600' }}>Delete</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function MetricTile({
  label,
  value,
  hint,
  colors,
}: {
  label: string;
  value: string;
  hint?: string;
  colors: { muted: string; foreground: string; surface: string; cardBorder: string };
}) {
  return (
    <View style={[styles.metricTile, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
      <Text style={{ color: colors.muted, fontSize: 9, fontWeight: '700', textTransform: 'uppercase' }}>{label}</Text>
      <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '700' }}>{value}</Text>
      {hint ? <Text style={{ color: colors.muted, fontSize: 10 }}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', gap: 16 },
  headerScore: { justifyContent: 'center', alignItems: 'center' },
  headerMeta: { flex: 1, gap: 4 },
  title: { fontSize: 18, fontWeight: '700' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  pill: { fontSize: 11, borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  section: { fontSize: 15, fontWeight: '700' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metricTile: { flexBasis: '30%', flexGrow: 1, borderWidth: 1, borderRadius: 8, padding: 10, gap: 2 },
  metricsBtn: { padding: 14, borderRadius: 10, borderWidth: 1 },
  finding: { padding: 12, borderRadius: 8, borderWidth: 1, gap: 4 },
  findingHead: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  sev: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  btn: { flex: 1, minWidth: '30%', padding: 12, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
});
