import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import type { MetricStatus, PerformanceMetricRow } from '../../lib/performance-metrics-rows';

const STATUS_LABEL: Record<MetricStatus, string> = {
  good: 'Good',
  warning: 'Needs attention',
  critical: 'Poor',
  neutral: '—',
};

const STATUS_STYLE: Record<MetricStatus, { bg: string; color: string }> = {
  good: { bg: 'rgba(34, 197, 94, 0.12)', color: '#22c55e' },
  warning: { bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' },
  critical: { bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' },
  neutral: { bg: 'rgba(148, 163, 184, 0.12)', color: '#64748b' },
};

type Props = {
  rows: PerformanceMetricRow[];
};

export function PerformanceMetricsTable({ rows }: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.table, { borderColor: colors.cardBorder }]}>
      <View style={[styles.headRow, { backgroundColor: colors.surface, borderBottomColor: colors.cardBorder }]}>
        <Text style={[styles.headCell, styles.colMetric, { color: colors.muted }]}>Metric</Text>
        <Text style={[styles.headCell, styles.colValue, { color: colors.muted }]}>Value</Text>
        <Text style={[styles.headCell, styles.colNotes, { color: colors.muted }]}>Notes</Text>
        <Text style={[styles.headCell, styles.colStatus, { color: colors.muted }]}>Status</Text>
      </View>
      {rows.map((row, index) => {
        const status = row.status ?? 'neutral';
        const s = STATUS_STYLE[status];
        return (
          <View
            key={`${row.metric}-${index}`}
            style={[
              styles.bodyRow,
              { borderBottomColor: colors.cardBorder },
              index === rows.length - 1 && styles.bodyRowLast,
            ]}
          >
            <Text style={[styles.bodyCell, styles.colMetric, { color: colors.foreground, fontWeight: '600' }]}>
              {row.metric}
            </Text>
            <Text style={[styles.bodyCell, styles.colValue, { color: colors.foreground, fontWeight: '700' }]}>{row.value}</Text>
            <Text style={[styles.bodyCell, styles.colNotes, { color: colors.muted }]}>{row.notes}</Text>
            <View style={styles.colStatus}>
              <View style={[styles.badge, { backgroundColor: s.bg }]}>
                <Text style={[styles.badgeText, { color: s.color }]}>{STATUS_LABEL[status]}</Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  table: { borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  headRow: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 10 },
  bodyRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    alignItems: 'center',
  },
  bodyRowLast: { borderBottomWidth: 0 },
  headCell: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, paddingHorizontal: 8 },
  bodyCell: { fontSize: 12, paddingHorizontal: 8, lineHeight: 17 },
  colMetric: { flex: 1.2 },
  colValue: { flex: 0.9 },
  colNotes: { flex: 1.2 },
  colStatus: { width: 92, paddingHorizontal: 8, alignItems: 'flex-end' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '700' },
});
