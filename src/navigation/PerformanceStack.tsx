import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { PerformanceScanScreen } from '../screens/performance/PerformanceScanScreen';
import { PerformanceResultScreen } from '../screens/performance/PerformanceResultScreen';
import { PerformanceHistoryScreen } from '../screens/performance/PerformanceHistoryScreen';
import type { PerformanceScanResult } from '../lib/performance-types';

export type PerformanceStackParamList = {
  PerformanceScan: undefined;
  PerformanceResult: { result: PerformanceScanResult };
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
      <Stack.Screen name="PerformanceHistory" component={PerformanceHistoryScreen} />
    </Stack.Navigator>
  );
}
