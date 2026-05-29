import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import type { PerformanceMetricRow } from '../../lib/performance-metrics-rows';

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
      </View>
      {rows.map((row, index) => (
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
          <Text style={[styles.bodyCell, styles.colValue, { color: colors.foreground }]}>{row.value}</Text>
          <Text style={[styles.bodyCell, styles.colNotes, { color: colors.muted }]}>{row.notes}</Text>
        </View>
      ))}
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
    alignItems: 'flex-start',
  },
  bodyRowLast: { borderBottomWidth: 0 },
  headCell: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, paddingHorizontal: 8 },
  bodyCell: { fontSize: 12, paddingHorizontal: 8, lineHeight: 17 },
  colMetric: { flex: 1.1 },
  colValue: { flex: 1 },
  colNotes: { flex: 1.4 },
});
