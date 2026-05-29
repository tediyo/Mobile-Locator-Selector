import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { PerformanceMetricsTable } from '../../components/performance/PerformanceMetricsTable';
import { useTheme } from '../../context/ThemeContext';
import { getPerformanceMetricRows } from '../../lib/performance-metrics-rows';
import type { PerformanceStackParamList } from '../../navigation/PerformanceStack';

type Props = NativeStackScreenProps<PerformanceStackParamList, 'PerformanceMetrics'>;

export function PerformanceMetricsScreen({ navigation, route }: Props) {
  const { result } = route.params;
  const { colors } = useTheme();
  const rows = getPerformanceMetricRows(result);

  return (
    <Screen scroll>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={{ color: colors.accent, fontWeight: '600', fontSize: 15 }}>← Back to results</Text>
      </Pressable>

      <Text style={[styles.title, { color: colors.foreground }]}>Performance metrics</Text>
      <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 14 }} numberOfLines={2}>
        {result.metrics.pageTitle || result.url}
      </Text>

      <PerformanceMetricsTable rows={rows} />

      <View style={{ marginTop: 16, gap: 4 }}>
        <Text style={{ color: colors.muted, fontSize: 11 }}>
          Synthetic lab scan · {result.viewport} viewport · median of {result.metrics.runCount ?? 3} passes
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { marginBottom: 12, paddingVertical: 4 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
});
