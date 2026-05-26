import { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/ui/Card';
import { DashboardHeader } from '../../components/DashboardHeader';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  clearPerformanceHistory,
  deletePerformanceScan,
  getPerformanceHistory,
} from '../../api/performance';
import { scoreColor } from '../../lib/performance-format';
import type { PerformanceScanResult } from '../../lib/performance-types';
import type { PerformanceStackParamList } from '../../navigation/PerformanceStack';

export function PerformanceHistoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<PerformanceStackParamList>>();
  const { token } = useAuth();
  const { colors } = useTheme();
  const [items, setItems] = useState<PerformanceScanResult[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getPerformanceHistory(token);
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const confirmClearAll = () => {
    Alert.alert('Clear history', 'Delete all performance scans?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear all',
        style: 'destructive',
        onPress: async () => {
          if (!token) return;
          await clearPerformanceHistory(token);
          setItems([]);
        },
      },
    ]);
  };

  const confirmDelete = (id: string) => {
    Alert.alert('Delete scan', 'Remove this scan?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!token) return;
          await deletePerformanceScan(token, id);
          setItems((prev) => prev.filter((s) => s._id !== id));
        },
      },
    ]);
  };

  return (
    <Screen scroll>
      <DashboardHeader />
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.foreground }]}>Performance history</Text>
        {items.length > 0 ? (
          <Pressable onPress={confirmClearAll}>
            <Text style={{ color: colors.error, fontSize: 13, fontWeight: '600' }}>Clear all</Text>
          </Pressable>
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
      ) : items.length === 0 ? (
        <Card>
          <Text style={{ color: colors.muted, textAlign: 'center' }}>No saved scans yet.</Text>
        </Card>
      ) : (
        items.map((scan) => (
          <Card key={scan._id} style={{ marginBottom: 10 }}>
            <Pressable
              onPress={() => navigation.navigate('PerformanceResult', { result: scan })}
              style={{ gap: 6 }}
            >
              <View style={styles.row}>
                <Text style={[styles.score, { color: scoreColor(scan.score) }]}>{Math.round(scan.score)}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground, fontWeight: '600' }} numberOfLines={1}>
                    {scan.url.replace(/^https?:\/\//, '')}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 11 }}>
                    {scan.viewport} · {new Date(scan.createdAt).toLocaleString()}
                  </Text>
                </View>
              </View>
            </Pressable>
            <Pressable onPress={() => confirmDelete(scan._id)} style={{ marginTop: 8 }}>
              <Text style={{ color: colors.error, fontSize: 12 }}>Delete</Text>
            </Pressable>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  score: { fontSize: 28, fontWeight: '800', width: 44 },
});
