import React, { useEffect, useId, useRef, useState } from 'react';
import {
  Animated,
  DimensionValue,
  Easing,
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { Card } from './Card';

export interface ShimmerProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  accent?: boolean;
}

/**
 * Base Shimmer block with a smooth GPU-accelerated gradient sweep.
 */
export function Shimmer({
  width = '100%',
  height = 16,
  borderRadius = 6,
  style,
  accent = false,
}: ShimmerProps) {
  const { colors } = useTheme();
  const rawId = useId();
  const gradientId = `shimmer_grad_${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;
  const [layoutWidth, setLayoutWidth] = useState<number>(300);
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1400,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - layoutWidth) > 5) {
      setLayoutWidth(w);
    }
  };

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-layoutWidth, layoutWidth * 1.5],
  });

  const baseBg = colors.shimmerBase;
  const highlight = accent ? colors.accent : colors.shimmerHighlight;

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.shimmerBox,
        {
          width,
          height,
          borderRadius,
          backgroundColor: baseBg,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            width: layoutWidth * 1.5,
            transform: [{ translateX }],
          },
        ]}
      >
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={highlight} stopOpacity={0} />
              <Stop offset="30%" stopColor={highlight} stopOpacity={accent ? 0.35 : 0.45} />
              <Stop offset="50%" stopColor={highlight} stopOpacity={accent ? 0.6 : 0.75} />
              <Stop offset="70%" stopColor={highlight} stopOpacity={accent ? 0.35 : 0.45} />
              <Stop offset="100%" stopColor={highlight} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradientId})`} />
        </Svg>
      </Animated.View>
    </View>
  );
}

/**
 * Ambient 2.5px traveling light beam sweeping continuously across the top of the mobile viewport.
 */
export function SystemShimmerBar() {
  const { colors } = useTheme();
  const rawId = useId();
  const beamId = `beam_grad_${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;
  const [barWidth, setBarWidth] = useState<number>(400);
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 2200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setBarWidth(w);
  };

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-barWidth * 0.7, barWidth * 1.2],
  });

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.systemBar,
        {
          backgroundColor: 'transparent',
          borderBottomColor: colors.cardBorder,
        },
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            width: barWidth * 0.7,
            transform: [{ translateX }],
          },
        ]}
      >
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id={beamId} x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={colors.accent} stopOpacity={0} />
              <Stop offset="50%" stopColor={colors.accent} stopOpacity={0.9} />
              <Stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${beamId})`} />
        </Svg>
      </Animated.View>
    </View>
  );
}

/**
 * 3 KPI metric cards shimmer skeleton (Overview Screen).
 */
export function SkeletonMetric() {
  return (
    <View style={styles.kpiRow}>
      <Card style={styles.kpiCard}>
        <Shimmer width={68} height={11} borderRadius={4} />
        <Shimmer width={50} height={26} borderRadius={6} style={{ marginTop: 8 }} accent />
      </Card>
      <Card style={styles.kpiCard}>
        <Shimmer width={54} height={11} borderRadius={4} />
        <Shimmer width={42} height={26} borderRadius={6} style={{ marginTop: 8 }} />
      </Card>
      <Card style={[styles.kpiCard, { flex: 1.2 }]}>
        <Shimmer width={58} height={11} borderRadius={4} />
        <Shimmer width={64} height={24} borderRadius={6} style={{ marginTop: 8 }} />
      </Card>
    </View>
  );
}

/**
 * Chart Skeleton for Activity Bar Chart or Locator Type Pie Chart.
 */
export function SkeletonChart({ type = 'bar' }: { type?: 'bar' | 'pie' }) {
  if (type === 'bar') {
    const barHeights = [45, 75, 95, 55, 110, 65, 80];
    return (
      <View style={styles.barChartContainer}>
        <View style={styles.barGrid}>
          {barHeights.map((h, i) => (
            <View key={i} style={styles.barCol}>
              <Shimmer
                width={22}
                height={h}
                borderRadius={4}
                accent={i === 4}
              />
              <Shimmer width={18} height={9} borderRadius={3} style={{ marginTop: 8 }} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  // Pie chart donut skeleton
  return (
    <View style={styles.pieContainer}>
      <View style={styles.donutPlaceholder}>
        <Shimmer width={130} height={130} borderRadius={65} />
      </View>
      <View style={styles.pieLegend}>
        <View style={styles.legendRow}>
          <Shimmer width={12} height={12} borderRadius={3} accent />
          <Shimmer width={70} height={12} borderRadius={4} />
        </View>
        <View style={styles.legendRow}>
          <Shimmer width={12} height={12} borderRadius={3} />
          <Shimmer width={85} height={12} borderRadius={4} />
        </View>
        <View style={styles.legendRow}>
          <Shimmer width={12} height={12} borderRadius={3} />
          <Shimmer width={55} height={12} borderRadius={4} />
        </View>
      </View>
    </View>
  );
}

/**
 * List / Table Card Skeletons for History & Audit listings.
 */
export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View style={{ gap: 10 }}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} style={{ gap: 8, padding: 14 }}>
          <View style={styles.headerRow}>
            <Shimmer width="55%" height={15} borderRadius={4} />
            <Shimmer width={50} height={18} borderRadius={10} />
          </View>
          <Shimmer width="80%" height={12} borderRadius={4} style={{ marginTop: 2 }} />
          <View style={styles.footerRow}>
            <Shimmer width={90} height={10} borderRadius={3} />
            <Shimmer width={60} height={10} borderRadius={3} />
          </View>
        </Card>
      ))}
    </View>
  );
}

/**
 * Skeleton shown while Locator Screen is generating results.
 */
export function SkeletonLocatorResults() {
  return (
    <View style={{ marginTop: 16, gap: 12 }}>
      <View style={styles.filterBarSkeleton}>
        <Shimmer width="32%" height={32} borderRadius={6} />
        <Shimmer width="32%" height={32} borderRadius={6} />
        <Shimmer width="32%" height={32} borderRadius={6} />
      </View>

      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i} style={{ gap: 10, padding: 14 }}>
          <View style={styles.headerRow}>
            <Shimmer width={55} height={20} borderRadius={4} accent />
            <Shimmer width={60} height={24} borderRadius={6} />
          </View>
          <Shimmer width="88%" height={14} borderRadius={4} />
          <Shimmer width={110} height={10} borderRadius={3} style={{ marginTop: 2 }} />
          <Shimmer width="100%" height={46} borderRadius={6} />
        </Card>
      ))}
    </View>
  );
}

/**
 * Skeleton shown during active 3-pass Performance Scanner scans.
 */
export function SkeletonPerformanceScan() {
  return (
    <View style={{ marginTop: 16, gap: 14 }}>
      <Card style={{ gap: 10, padding: 14 }}>
        <View style={styles.headerRow}>
          <Shimmer width={140} height={14} borderRadius={4} accent />
          <Shimmer width={60} height={16} borderRadius={8} />
        </View>
        <Shimmer width="100%" height={8} borderRadius={4} accent />
        <Shimmer width="70%" height={11} borderRadius={3} />
      </Card>

      <View style={styles.kpiRow}>
        <Card style={styles.kpiCard}>
          <Shimmer width={50} height={10} borderRadius={3} />
          <Shimmer width={40} height={22} borderRadius={5} style={{ marginTop: 6 }} />
        </Card>
        <Card style={styles.kpiCard}>
          <Shimmer width={50} height={10} borderRadius={3} />
          <Shimmer width={40} height={22} borderRadius={5} style={{ marginTop: 6 }} />
        </Card>
        <Card style={styles.kpiCard}>
          <Shimmer width={50} height={10} borderRadius={3} />
          <Shimmer width={40} height={22} borderRadius={5} style={{ marginTop: 6 }} accent />
        </Card>
      </View>

      <Card style={{ gap: 12, padding: 14 }}>
        <Shimmer width={120} height={14} borderRadius={4} />
        <View style={{ gap: 8 }}>
          <Shimmer width="100%" height={24} borderRadius={5} />
          <Shimmer width="100%" height={24} borderRadius={5} />
          <Shimmer width="100%" height={24} borderRadius={5} />
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  shimmerBox: {
    overflow: 'hidden',
  },
  systemBar: {
    height: 2.5,
    width: '100%',
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    padding: 12,
  },
  barChartContainer: {
    paddingVertical: 12,
  },
  barGrid: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 140,
    paddingHorizontal: 8,
  },
  barCol: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  pieContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
  },
  donutPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieLegend: {
    gap: 12,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  filterBarSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
});
