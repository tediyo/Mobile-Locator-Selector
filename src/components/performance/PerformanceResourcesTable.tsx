import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { formatBytes, formatMs } from '../../lib/performance-format';
import type { NetworkResourceRow } from '../../lib/performance-types';

type Props = {
  rows: NetworkResourceRow[];
};

export function PerformanceResourcesTable({ rows }: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.table, { borderColor: colors.cardBorder }]}>
      <View style={[styles.headRow, { backgroundColor: colors.surface, borderBottomColor: colors.cardBorder }]}>
        <Text style={[styles.headCell, styles.colUrl, { color: colors.muted }]}>URL</Text>
        <Text style={[styles.headCell, styles.colType, { color: colors.muted }]}>Type</Text>
        <Text style={[styles.headCell, styles.colStatus, { color: colors.muted }]}>Status</Text>
        <Text style={[styles.headCell, styles.colDuration, { color: colors.muted }]}>Duration</Text>
        <Text style={[styles.headCell, styles.colSize, { color: colors.muted }]}>Size</Text>
      </View>
      {rows.map((r, index) => (
        <View
          key={`${r.url}-${index}`}
          style={[
            styles.bodyRow,
            { borderBottomColor: colors.cardBorder },
            index === rows.length - 1 && styles.bodyRowLast,
          ]}
        >
          <Text style={[styles.bodyCell, styles.colUrl, { color: colors.foreground }]} numberOfLines={1}>
            {r.url}
          </Text>
          <Text style={[styles.bodyCell, styles.colType, { color: colors.foreground }]}>{r.resourceType}</Text>
          <Text style={[styles.bodyCell, styles.colStatus, { color: colors.foreground }]}>{r.status}</Text>
          <Text style={[styles.bodyCell, styles.colDuration, { color: colors.foreground }]}>{formatMs(r.durationMs)}</Text>
          <Text style={[styles.bodyCell, styles.colSize, { color: colors.foreground }]}>{formatBytes(r.transferSize)}</Text>
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
    alignItems: 'center',
  },
  bodyRowLast: { borderBottomWidth: 0 },
  headCell: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, paddingHorizontal: 8 },
  bodyCell: { fontSize: 11, paddingHorizontal: 8 },
  colUrl: { flex: 2.2, minWidth: 100 },
  colType: { flex: 0.8, minWidth: 50 },
  colStatus: { flex: 0.6, minWidth: 40 },
  colDuration: { flex: 0.8, minWidth: 50 },
  colSize: { flex: 0.8, minWidth: 50 },
});
