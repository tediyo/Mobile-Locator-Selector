import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import type { ActivityPoint, PiePoint } from '../lib/dashboard-analytics';
import { useTheme } from '../context/ThemeContext';

const chartWidth = Dimensions.get('window').width - 64;
const BAR_HEIGHT = 200;

export function ActivityBarChart({ data }: { data: ActivityPoint[] }) {
  const { colors } = useTheme();

  if (!data.length) {
    return <Text style={{ color: colors.muted, textAlign: 'center' }}>No activity data</Text>;
  }

  const maxValue = Math.max(...data.map((d) => d.searches), 1);
  const barSlot = chartWidth / data.length;
  const barWidth = Math.min(28, Math.max(12, barSlot - 8));

  return (
    <View style={styles.wrap}>
      <View style={[styles.barRow, { height: BAR_HEIGHT }]}>
        {data.map((d) => {
          const h = Math.max(4, (d.searches / maxValue) * (BAR_HEIGHT - 24));
          return (
            <View key={d.date} style={[styles.barSlot, { width: barSlot }]}>
              <View
                style={[
                  styles.bar,
                  {
                    height: h,
                    width: barWidth,
                    backgroundColor: colors.accent,
                  },
                ]}
              />
              <Text style={[styles.barLabel, { color: colors.muted }]} numberOfLines={1}>
                {d.date.length > 8 ? d.date.slice(0, 6) : d.date}
              </Text>
            </View>
          );
        })}
      </View>
      <Text style={[styles.axisHint, { color: colors.muted }]}>
        Max: {maxValue} search{maxValue === 1 ? '' : 'es'}
      </Text>
    </View>
  );
}

function DonutChart({
  data,
  size,
  innerRadius,
  backgroundColor,
}: {
  data: PiePoint[];
  size: number;
  innerRadius: number;
  backgroundColor: string;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total <= 0) return null;

  const radius = size / 2;
  const strokeWidth = radius - innerRadius;
  const r = radius - strokeWidth / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <Svg width={size} height={size}>
      <G transform={`rotate(-90 ${radius} ${radius})`}>
        {data.map((slice) => {
          const dash = (slice.value / total) * circumference;
          const el = (
            <Circle
              key={slice.name}
              cx={radius}
              cy={radius}
              r={r}
              stroke={slice.color}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += dash;
          return el;
        })}
      </G>
      <Circle cx={radius} cy={radius} r={innerRadius} fill={backgroundColor} />
    </Svg>
  );
}

export function LocatorPieChart({ data }: { data: PiePoint[] }) {
  const { colors } = useTheme();

  if (!data.length) {
    return <Text style={{ color: colors.muted, textAlign: 'center' }}>No data</Text>;
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <View style={styles.pieWrap}>
      <DonutChart data={data} size={180} innerRadius={60} backgroundColor={colors.cardBg} />
      <View style={styles.legend}>
        {data.map((d) => (
          <View key={d.name} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: d.color }]} />
            <Text style={[styles.legendText, { color: colors.muted }]}>
              {d.name} ({total > 0 ? Math.round((d.value / total) * 100) : 0}%)
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', overflow: 'hidden' },
  barRow: { flexDirection: 'row', alignItems: 'flex-end', width: '100%' },
  barSlot: { alignItems: 'center', justifyContent: 'flex-end' },
  bar: { borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  barLabel: { fontSize: 9, marginTop: 4, textAlign: 'center', maxWidth: 48 },
  axisHint: { fontSize: 10, marginTop: 8 },
  pieWrap: { alignItems: 'center', gap: 12 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, textTransform: 'capitalize' },
});
