import Clipboard from '@react-native-clipboard/clipboard';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { DashboardHeader } from '../components/DashboardHeader';
import { Screen } from '../components/Screen';
import { Card } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useUserData } from '../context/UserDataContext';
import type { RootStackParamList } from '../navigation/types';
import { monoFont } from '../theme/tokens';

export function HistoryScreen() {
  const { token, isGuest } = useAuth();
  const { colors } = useTheme();
  const { history, historyLoading } = useUserData();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [expanded, setExpanded] = useState<string | null>(null);

  const entries = history ?? [];
  const showInitialLoader = historyLoading && entries.length === 0;

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

  return (
    <Screen scroll>
      <DashboardHeader />
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.foreground }]}>Search History</Text>
        <View style={[styles.badge, { backgroundColor: colors.badgeBg, borderColor: colors.cardBorder }]}>
          <Text style={{ color: colors.badgeText, fontSize: 12, fontWeight: '600' }}>
            {entries.length} {entries.length === 1 ? 'Search' : 'Searches'}
          </Text>
        </View>
      </View>

      {showInitialLoader ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
      ) : entries.length === 0 ? (
        <Card>
          <Text style={{ color: colors.muted, textAlign: 'center' }}>No history yet. Generate locators on the Locator tab.</Text>
        </Card>
      ) : (
        entries.map((entry) => (
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
