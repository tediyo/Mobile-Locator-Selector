import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { ScoreRing } from '../../components/performance/ScoreRing';
import { Card } from '../../components/ui/Card';
import { useTheme } from '../../context/ThemeContext';
import {
    formatBytes,
    formatMs,
    severityBg,
    severityColor,
} from '../../lib/performance-format';
import type { PerformanceScanResult } from '../../lib/performance-types';
import type { PerformanceStackParamList } from '../../navigation/PerformanceStack';
type Props = {
  result: PerformanceScanResult;
  onDelete?: () => void;
  onRerun?: () => void;
};

export function PerformanceResultView({ result, onDelete, onRerun }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<PerformanceStackParamList>>();
  const { colors } = useTheme();
  const m = result.metrics;
  const [downloading, setDownloading] = useState(false);

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
              <Text style={[styles.pill, { color: colors.muted, borderColor: colors.cardBorder }]}>
                Scan time: {formatMs(result.durationMs)}
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
        <View style={styles.summaryRow}>
          <SummaryChip label="TTFB" value={formatMs(m.ttfbMs)} colors={colors} />
          <SummaryChip label="LCP" value={formatMs(m.lcpMs)} colors={colors} />
          <SummaryChip label="Load" value={formatMs(m.loadTimeMs)} colors={colors} />
        </View>
        <Pressable
          onPress={() => navigation.navigate('PerformanceMetrics', { result })}
          style={[styles.metricsBtn, { borderColor: colors.accent, backgroundColor: colors.surface }]}
        >
          <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 15 }}>Performance metrics</Text>
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
            View full table (timing, network, DOM, scan info)
          </Text>
        </Pressable>
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
        <Card style={{ gap: 8 }}>
          <Text style={[styles.section, { color: colors.foreground }]}>Slowest resources</Text>
          {result.networkTop.slice(0, 8).map((r, i) => (
            <View key={i} style={[styles.netRow, { borderBottomColor: colors.cardBorder }]}>
              <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '600' }} numberOfLines={1}>
                {r.resourceType} · {r.status}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 11 }} numberOfLines={2}>
                {r.url}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 11 }}>
                {formatMs(r.durationMs)} · {formatBytes(r.transferSize)}
              </Text>
            </View>
          ))}
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

function SummaryChip({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: { muted: string; foreground: string; surface: string };
}) {
  return (
    <View style={[styles.summaryChip, { backgroundColor: colors.surface }]}>
      <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '600' }}>{label}</Text>
      <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '700' }}>{value}</Text>
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
  summaryRow: { flexDirection: 'row', gap: 8 },
  summaryChip: { flex: 1, padding: 10, borderRadius: 8, gap: 2, alignItems: 'center' },
  metricsBtn: { padding: 14, borderRadius: 10, borderWidth: 1 },
  finding: { padding: 12, borderRadius: 8, borderWidth: 1, gap: 4 },
  findingHead: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  sev: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  netRow: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, gap: 2 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  btn: { flex: 1, minWidth: '30%', padding: 12, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
});
