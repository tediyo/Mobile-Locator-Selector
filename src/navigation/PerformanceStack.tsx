import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import type { PerformanceScanResult } from '../lib/performance-types';
import { PerformanceHistoryScreen } from '../screens/performance/PerformanceHistoryScreen';
import { PerformanceMetricsScreen } from '../screens/performance/PerformanceMetricsScreen';
import { PerformanceResultScreen } from '../screens/performance/PerformanceResultScreen';
import { PerformanceScanScreen } from '../screens/performance/PerformanceScanScreen';

export type PerformanceStackParamList = {
  PerformanceScan: { url?: string; viewport?: 'desktop' | 'mobile'; autoStart?: boolean } | undefined;
  PerformanceResult: { result: PerformanceScanResult };
  PerformanceMetrics: { result: PerformanceScanResult };
  PerformanceHistory: undefined;
};

const Stack = createNativeStackNavigator<PerformanceStackParamList>();

export function PerformanceStack() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="PerformanceScan" component={PerformanceScanScreen} />
      <Stack.Screen name="PerformanceResult" component={PerformanceResultScreen} />
      <Stack.Screen name="PerformanceMetrics" component={PerformanceMetricsScreen} />
      <Stack.Screen name="PerformanceHistory" component={PerformanceHistoryScreen} />
    </Stack.Navigator>
  );
}
