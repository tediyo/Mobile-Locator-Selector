import Clipboard from '@react-native-clipboard/clipboard';

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { deleteLocatorHistoryEntry } from '../api/locator';
import { deletePerformanceScan, getPerformanceHistory } from '../api/performance';
import { DashboardHeader } from '../components/DashboardHeader';
import { Screen } from '../components/Screen';
import { Card } from '../components/ui/Card';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useUserData } from '../context/UserDataContext';
import { scoreColor } from '../lib/performance-format';
import type { PerformanceScanResult } from '../lib/performance-types';
import { monoFont } from '../theme/tokens';

type HistoryTab = 'selector' | 'performance';

export function HistoryScreen() {
  const { token, isGuest } = useAuth();
  const { colors } = useTheme();
  const { history, historyLoading, refreshHistory, invalidateHistory } = useUserData();
  const navigation = useNavigation<any>();

  const [activeTab, setActiveTab] = useState<HistoryTab>('selector');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [perfItems, setPerfItems] = useState<PerformanceScanResult[]>([]);
  const [perfLoading, setPerfLoading] = useState(true);

  const locatorEntries = history ?? [];

  const loadPerformance = useCallback(async () => {
    if (!token) return;
    setPerfLoading(true);
    try {
      setPerfItems(await getPerformanceHistory(token));
    } catch {
      setPerfItems([]);
    } finally {
      setPerfLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      if (!token || isGuest) return;
      refreshHistory();
      loadPerformance();
    }, [token, isGuest, refreshHistory, loadPerformance]),
  );

  const deleteLocator = (id: string) => {
    Alert.alert('Delete entry', 'Remove this locator search?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!token) return;
          try {
            await deleteLocatorHistoryEntry(token, id);
            invalidateHistory();
            refreshHistory(true);
          } catch {
            Alert.alert('Error', 'Could not delete entry.');
          }
        },
      },
    ]);
  };

  const deletePerformance = (id: string) => {
    Alert.alert('Delete scan', 'Remove this performance scan?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!token) return;
          try {
            await deletePerformanceScan(token, id);
            setPerfItems((prev) => prev.filter((s) => s._id !== id));
          } catch {
            Alert.alert('Error', 'Could not delete scan.');
          }
        },
      },
    ]);
  };

  const rerunLocator = (url: string, keyword: string, locatorType: string) => {
    navigation.navigate('Locator', { url, keyword, locatorType, autoRun: true });
  };

  const rerunPerformance = (url: string, viewport: string) => {
    navigation.navigate('Performance', {
      screen: 'PerformanceScan',
      params: { url, viewport: viewport === 'mobile' ? 'mobile' : 'desktop', autoStart: true },
    });
  };


  if (isGuest || !token) {
    return (
      <Screen scroll>
        <DashboardHeader />
        <Card>
          <Text style={[styles.title, { color: colors.accent }]}>Search History</Text>
          <Text style={{ color: colors.muted, marginTop: 8 }}>Sign up to save and view search history.</Text>
          <Pressable onPress={() => navigation.navigate('Signup')} style={{ marginTop: 16 }}>
            <Text style={{ color: colors.accent, fontWeight: '600' }}>Sign Up →</Text>
          </Pressable>
        </Card>
      </Screen>
    );
  }

  const isSelectorTab = activeTab === 'selector';
  const count = isSelectorTab ? locatorEntries.length : perfItems.length;
  const loading = isSelectorTab
    ? historyLoading && locatorEntries.length === 0
    : perfLoading && perfItems.length === 0;

  return (
    <Screen scroll>
      <DashboardHeader />
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.foreground }]}>History</Text>
        <View style={[styles.badge, { backgroundColor: colors.badgeBg, borderColor: colors.cardBorder }]}>
          <Text style={{ color: colors.badgeText, fontSize: 12, fontWeight: '600' }}>
            {count} {count === 1 ? 'Entry' : 'Entries'}
          </Text>
        </View>
      </View>

      <SegmentedControl
        value={activeTab}
        onChange={(t) => {
          setActiveTab(t);
          setExpanded(null);
        }}
        style={{ marginBottom: 16 }}
        options={[
          { value: 'selector', label: `Locator (${locatorEntries.length})` },
          { value: 'performance', label: `Performance (${perfItems.length})` },
        ]}
      />

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
      ) : count === 0 ? (
        <Card>
          <Text style={{ color: colors.muted, textAlign: 'center' }}>
            {isSelectorTab
              ? 'No locator history yet. Generate locators on the Locator tab.'
              : 'No performance scans yet. Run a scan on the Performance tab.'}
          </Text>
        </Card>
      ) : isSelectorTab ? (
        locatorEntries.map((entry) => (
          <Card key={entry._id} style={{ marginBottom: 10 }}>
            <Pressable onPress={() => setExpanded(expanded === entry._id ? null : entry._id)}>
              <View style={styles.entryRow}>
                <Text style={{ fontWeight: '600', color: colors.foreground, flexShrink: 1 }} numberOfLines={1}>
                  {entry.keyword}
                </Text>
                <View style={[styles.typePill, { borderColor: colors.cardBorder }]}>
                  <Text style={{ fontSize: 10, color: colors.muted, textTransform: 'uppercase' }}>{entry.locatorType}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }} numberOfLines={1}>
                {entry.url.replace(/^https?:\/\//, '')}
              </Text>
              <Text style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>
                {entry.results.length} results · {new Date(entry.createdAt).toLocaleDateString()}
              </Text>
            </Pressable>

            <View style={styles.actionRow}>
              <Pressable
                onPress={() => rerunLocator(entry.url, entry.keyword, entry.locatorType)}
                style={[styles.actionBtn, { borderColor: colors.cardBorder }]}
              >
                <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '600' }}>↻ Re-run</Text>
              </Pressable>
              <Pressable
                onPress={() => deleteLocator(entry._id)}
                style={[styles.actionBtn, { borderColor: colors.cardBorder }]}
              >
                <Text style={{ color: colors.error, fontSize: 12, fontWeight: '600' }}>Delete</Text>
              </Pressable>
            </View>

            {expanded === entry._id && (
              <View style={{ marginTop: 12, gap: 8, borderTopWidth: 1, borderTopColor: colors.cardBorder, paddingTop: 12 }}>
                {entry.results.map((res, i) => (
                  <View key={i} style={[styles.resultBox, { backgroundColor: colors.codeBg }]}>
                    <Text style={{ fontSize: 11, color: colors.tagText }}>{res.tag}</Text>
                    <Text style={{ fontFamily: monoFont, fontSize: 12, color: colors.mutedStrong, marginTop: 4 }} selectable>
                      {res.locator}
                    </Text>
                    <Pressable onPress={() => Clipboard.setString(res.locator)} style={{ marginTop: 6 }}>
                      <Text style={{ color: colors.accent, fontSize: 12 }}>Copy locator</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </Card>
        ))
      ) : (
        perfItems.map((scan) => (
          <Card key={scan._id} style={{ marginBottom: 10 }}>
            <Pressable onPress={() => setExpanded(expanded === scan._id ? null : scan._id)} style={{ gap: 6 }}>
              <View style={styles.entryRow}>
                <Text style={[styles.score, { color: scoreColor(scan.score) }]}>{Math.round(scan.score)}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground, fontWeight: '600' }} numberOfLines={1}>
                    {scan.metrics.pageTitle || scan.url.replace(/^https?:\/\//, '')}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 11 }}>
                    {scan.viewport} · {new Date(scan.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </Pressable>

            <View style={styles.actionRow}>
              <Pressable
                onPress={() => navigation.navigate('Performance', { screen: 'PerformanceResult', params: { result: scan } })}
                style={[styles.actionBtn, { borderColor: colors.cardBorder }]}
              >
                <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '600' }}>View</Text>
              </Pressable>
              <Pressable
                onPress={() => rerunPerformance(scan.url, scan.viewport)}
                style={[styles.actionBtn, { borderColor: colors.cardBorder }]}
              >
                <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '600' }}>↻ Re-run</Text>
              </Pressable>
              <Pressable
                onPress={() => deletePerformance(scan._id)}
                style={[styles.actionBtn, { borderColor: colors.cardBorder }]}
              >
                <Text style={{ color: colors.error, fontSize: 12, fontWeight: '600' }}>Delete</Text>
              </Pressable>
            </View>

            {expanded === scan._id && (
              <View style={{ marginTop: 12, gap: 8, borderTopWidth: 1, borderTopColor: colors.cardBorder, paddingTop: 12 }}>
                <View style={styles.statRow}>
                  <Stat label="Score" value={String(Math.round(scan.score))} colors={colors} />
                  <Stat label="Requests" value={String(scan.metrics.requestCount)} colors={colors} />
                  <Stat
                    label="Transfer"
                    value={scan.metrics.totalTransferBytes ? `${Math.round(scan.metrics.totalTransferBytes / 1024)} KB` : '—'}
                    colors={colors}
                  />
                </View>
                {scan.findings.slice(0, 3).map((f, i) => (
                  <View key={i} style={[styles.resultBox, { backgroundColor: colors.codeBg }]}>
                    <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: 13 }}>{f.title}</Text>
                    <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>{f.message}</Text>
                    <Text style={{ color: colors.muted, fontSize: 10, marginTop: 2 }}>
                      {f.category} · {f.severity}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Card>
        ))
      )}
    </Screen>
  );
}

function Stat({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={[styles.stat, { borderColor: colors.cardBorder }]}>
      <Text style={{ fontSize: 10, color: colors.muted, textTransform: 'uppercase' }}>{label}</Text>
      <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground, marginTop: 2 }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '700' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  entryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typePill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  resultBox: { padding: 10, borderRadius: 8 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  score: { fontSize: 22, fontWeight: '800', minWidth: 36 },
  statRow: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1 },
});
