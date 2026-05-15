import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Screen } from '@/src/components/Screen';
import { Card } from '@/src/components/ui/Card';
import { DashboardHeader } from '@/src/components/DashboardHeader';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { apiFetch } from '@/src/api/client';
import type { HistoryEntry } from '@/src/lib/dashboard-analytics';

export default function HistoryScreen() {
  const { token, isGuest } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || isGuest) return;
    (async () => {
      const { ok, data } = await apiFetch<HistoryEntry[]>('/locator/history', { token });
      if (ok) setHistory(data);
      setLoading(false);
    })();
  }, [token, isGuest]);

  if (isGuest || !token) {
    return (
      <Screen scroll>
        <DashboardHeader />
        <Card>
          <Text style={[styles.title, { color: colors.accent }]}>Search History</Text>
          <Text style={{ color: colors.muted, marginTop: 8 }}>Sign up to save and view search history.</Text>
          <Pressable onPress={() => router.push('/signup')} style={{ marginTop: 16 }}>
            <Text style={{ color: colors.accent, fontWeight: '600' }}>Sign Up →</Text>
          </Pressable>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <DashboardHeader />
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.foreground }]}>Search History</Text>
        <View style={[styles.badge, { backgroundColor: colors.badgeBg, borderColor: colors.cardBorder }]}>
          <Text style={{ color: colors.badgeText, fontSize: 12, fontWeight: '600' }}>
            {history.length} {history.length === 1 ? 'Search' : 'Searches'}
          </Text>
        </View>
      </View>

      {loading ? (
        <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 24 }}>Loading…</Text>
      ) : history.length === 0 ? (
        <Card>
          <Text style={{ color: colors.muted, textAlign: 'center' }}>No history yet. Generate locators on the Locator tab.</Text>
        </Card>
      ) : (
        history.map((entry) => (
          <Card key={entry._id} style={{ marginBottom: 10 }}>
            <Pressable onPress={() => setExpanded(expanded === entry._id ? null : entry._id)}>
              <View style={styles.entryRow}>
                <Text style={{ fontWeight: '600', color: colors.foreground }}>{entry.keyword}</Text>
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
            {expanded === entry._id && (
              <View style={{ marginTop: 12, gap: 8, borderTopWidth: 1, borderTopColor: colors.cardBorder, paddingTop: 12 }}>
                {entry.results.map((res, i) => (
                  <View key={i} style={[styles.resultBox, { backgroundColor: colors.codeBg }]}>
                    <Text style={{ fontSize: 11, color: colors.tagText }}>{res.tag}</Text>
                    <Text style={{ fontFamily: 'monospace', fontSize: 12, color: colors.mutedStrong, marginTop: 4 }} selectable>
                      {res.locator}
                    </Text>
                    <Pressable onPress={() => Clipboard.setStringAsync(res.locator)} style={{ marginTop: 6 }}>
                      <Text style={{ color: colors.accent, fontSize: 12 }}>Copy locator</Text>
                    </Pressable>
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

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '700' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  entryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typePill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  resultBox: { padding: 10, borderRadius: 8 },
});
