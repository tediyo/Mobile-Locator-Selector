import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import type { ActivityPoint, PiePoint } from '../lib/dashboard-analytics';

const chartWidth = Dimensions.get('window').width - 64;
const CHART_HEIGHT = 200;
const PADDING = 20;

// Catmull-Rom spline interpolation for smooth curves
function createSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  
  const tension = 0.4;
  let path = `M ${points[0].x} ${points[0].y}`;
  
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    
    const cp1x = p1.x + (p2.x - p0.x) * tension / 3;
    const cp1y = p1.y + (p2.y - p0.y) * tension / 3;
    const cp2x = p2.x - (p3.x - p1.x) * tension / 3;
    const cp2y = p2.y - (p3.y - p1.y) * tension / 3;
    
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  
  return path;
}

export const ActivityBarChart = React.memo(function ActivityBarChart({ data }: { data: ActivityPoint[] }) {
  const { colors } = useTheme();

  if (!data.length) {
    return <Text style={{ color: colors.muted, textAlign: 'center' }}>No activity data</Text>;
  }

  const maxValue = Math.max(...data.map((d) => d.searches), 1);
  const stepX = (chartWidth - PADDING * 2) / (data.length - 1 || 1);
  
  const points = data.map((d, i) => ({
    x: PADDING + i * stepX,
    y: CHART_HEIGHT - PADDING - (d.searches / maxValue) * (CHART_HEIGHT - PADDING * 2),
  }));
  
  const linePath = createSmoothPath(points);
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${CHART_HEIGHT - PADDING} L ${points[0].x} ${CHART_HEIGHT - PADDING} Z`;

  return (
    <View style={styles.wrap}>
      <Svg width={chartWidth} height={CHART_HEIGHT}>
        <Defs>
          <LinearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={colors.accent} stopOpacity="0.4" />
            <Stop offset="100%" stopColor={colors.accent} stopOpacity="0.05" />
          </LinearGradient>
        </Defs>
        
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = PADDING + ratio * (CHART_HEIGHT - PADDING * 2);
          return (
            <Path
              key={ratio}
              d={`M ${PADDING} ${y} L ${chartWidth - PADDING} ${y}`}
              stroke={colors.muted}
              strokeOpacity="0.1"
              strokeWidth="1"
            />
          );
        })}
        
        {/* Area fill */}
        <Path d={areaPath} fill="url(#gradient)" />
        
        {/* Line */}
        <Path d={linePath} stroke={colors.accent} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Data points */}
        {points.map((p, i) => (
          <Circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            fill={colors.cardBg}
            stroke={colors.accent}
            strokeWidth="2"
          />
        ))}
      </Svg>
      
      {/* X-axis labels */}
      <View style={[styles.xAxisLabels, { width: chartWidth }]}>
        {data.map((d, i) => {
          if (data.length > 10 && i % Math.ceil(data.length / 5) !== 0) return null;
          return (
            <Text key={d.date} style={[styles.xAxisLabel, { color: colors.muted }]}>
              {d.date.length > 8 ? d.date.slice(0, 6) : d.date}
            </Text>
          );
        })}
      </View>
      
      <Text style={[styles.axisHint, { color: colors.muted }]}>
        Max: {maxValue} search{maxValue === 1 ? '' : 'es'}
      </Text>
    </View>
  );
});

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

export const LocatorPieChart = React.memo(function LocatorPieChart({ data }: { data: PiePoint[] }) {
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
});

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', overflow: 'hidden' },
  xAxisLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingHorizontal: PADDING },
  xAxisLabel: { fontSize: 9, textAlign: 'center' },
  axisHint: { fontSize: 10, marginTop: 8 },
  pieWrap: { alignItems: 'center', gap: 12 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, textTransform: 'capitalize' },
});
