import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import type { ActivityPoint, PiePoint } from '@/src/lib/dashboard-analytics';
import { useTheme } from '@/src/context/ThemeContext';

const chartWidth = Dimensions.get('window').width - 64;

export function ActivityBarChart({ data }: { data: ActivityPoint[] }) {
  const { colors } = useTheme();
  const barData = data.map((d) => ({
    value: d.searches,
    label: d.date.length > 8 ? d.date.slice(0, 6) : d.date,
    frontColor: colors.accent,
  }));

  if (!barData.length) {
    return <Text style={{ color: colors.muted, textAlign: 'center' }}>No activity data</Text>;
  }

  return (
    <View style={styles.wrap}>
      <BarChart
        data={barData}
        width={chartWidth}
        height={200}
        barWidth={Math.min(28, chartWidth / Math.max(barData.length, 1) - 8)}
        spacing={8}
        roundedTop
        hideRules
        xAxisColor={colors.cardBorder}
        yAxisColor={colors.cardBorder}
        yAxisTextStyle={{ color: colors.muted, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: colors.muted, fontSize: 9, rotation: 0 }}
        noOfSections={4}
        isAnimated={false}
      />
    </View>
  );
}

export function LocatorPieChart({ data }: { data: PiePoint[] }) {
  const { colors } = useTheme();
  if (!data.length) {
    return <Text style={{ color: colors.muted, textAlign: 'center' }}>No data</Text>;
  }

  const pieData = data.map((d) => ({ value: d.value, color: d.color, text: d.name }));

  return (
    <View style={styles.pieWrap}>
      <PieChart
        data={pieData}
        donut
        radius={90}
        innerRadius={60}
        innerCircleColor={colors.cardBg}
        isAnimated={false}
        showText
        textColor={colors.foreground}
        textSize={10}
      />
      <View style={styles.legend}>
        {data.map((d) => (
          <View key={d.name} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: d.color }]} />
            <Text style={[styles.legendText, { color: colors.muted }]}>{d.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', overflow: 'hidden' },
  pieWrap: { alignItems: 'center', gap: 12 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, textTransform: 'capitalize' },
});
