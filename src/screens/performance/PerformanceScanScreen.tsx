import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/ui/Card';
import { AppInput } from '../../components/ui/AppInput';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { DashboardHeader } from '../../components/DashboardHeader';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { runPerformanceScan } from '../../api/performance';
import type { PerformanceStackParamList } from '../../navigation/PerformanceStack';
import type { PerformanceViewport } from '../../lib/performance-types';

export function PerformanceScanScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<PerformanceStackParamList>>();
  const { token, isGuest } = useAuth();
  const { colors } = useTheme();
  const [url, setUrl] = useState('https://');
  const [viewport, setViewport] = useState<PerformanceViewport>('desktop');
  const [cookies, setCookies] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');

  const handleScan = async () => {
    const trimmed = url.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setError('Enter a full URL including https://');
      return;
    }
    setError('');
    setScanning(true);
    try {
      const result = await runPerformanceScan(token, {
        url: trimmed,
        viewport,
        cookies: cookies || undefined,
        authToken: authToken || undefined,
      });
      navigation.navigate('PerformanceResult', { result });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  return (
    <Screen scroll>
      <DashboardHeader />
      <Text style={[styles.title, { color: colors.foreground }]}>Performance scan</Text>
      <Text style={{ color: colors.muted, marginBottom: 12, fontSize: 13 }}>
        Server-side Playwright lab scan · 3 cold passes · ~1–2 minutes
      </Text>

      {isGuest || !token ? (
        <View style={[styles.banner, { backgroundColor: colors.badgeBg, borderColor: colors.cardBorder }]}>
          <Text style={{ color: colors.tagText, fontSize: 13 }}>
            Sign in to save scan history. Guest scans still work but are not stored.
          </Text>
        </View>
      ) : null}

      <Card style={{ gap: 14 }}>
        <AppInput
          label="Target URL"
          value={url}
          onChangeText={setUrl}
          placeholder="https://www.example.com"
          autoCapitalize="none"
          keyboardType="url"
        />

        <Text style={[styles.label, { color: colors.muted }]}>VIEWPORT</Text>
        <Text style={{ color: colors.muted, fontSize: 12, marginTop: -8 }}>
          Use the same viewport as the web app for matching scores (web default: desktop).
        </Text>
        <View style={[styles.row, { borderColor: colors.cardBorder, backgroundColor: colors.surface }]}>
          {(['desktop', 'mobile'] as const).map((v) => (
            <Pressable
              key={v}
              onPress={() => setViewport(v)}
              style={[styles.chip, viewport === v && { backgroundColor: colors.accent }]}
            >
              <Text
                style={{
                  fontWeight: '600',
                  fontSize: 13,
                  color: viewport === v ? colors.primaryText : colors.muted,
                  textTransform: 'capitalize',
                }}
              >
                {v}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable onPress={() => setShowAuth(!showAuth)}>
          <Text style={{ color: colors.accent, fontWeight: '600', fontSize: 13 }}>
            {showAuth ? '▼' : '▶'} Target site auth (cookies / bearer)
          </Text>
        </Pressable>
        {showAuth ? (
          <>
            <AppInput
              label="Cookies"
              value={cookies}
              onChangeText={setCookies}
              placeholder="session=abc; token=xyz"
              optional
            />
            <AppInput
              label="Bearer token (target site)"
              value={authToken}
              onChangeText={setAuthToken}
              placeholder="JWT for the site under test"
              optional
              autoCapitalize="none"
            />
          </>
        ) : null}

        {error ? <Text style={{ color: colors.error, fontSize: 13 }}>{error}</Text> : null}

        <PrimaryButton
          title={scanning ? 'Scanning…' : 'Run stable scan'}
          onPress={handleScan}
          loading={scanning}
          disabled={scanning}
        />

        {scanning ? (
          <Text style={{ color: colors.muted, fontSize: 12, textAlign: 'center' }}>
            Running 3 passes with cache disabled. Keep the app open (~1–2 min).
          </Text>
        ) : null}
      </Card>

      {token && !isGuest ? (
        <Pressable
          onPress={() => navigation.navigate('PerformanceHistory')}
          style={[styles.historyLink, { borderColor: colors.cardBorder }]}
        >
          <Text style={{ color: colors.accent, fontWeight: '600' }}>View scan history →</Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  banner: { padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 12 },
  label: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  row: { flexDirection: 'row', borderRadius: 8, borderWidth: 1, padding: 4, gap: 4 },
  chip: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  historyLink: { marginTop: 16, padding: 14, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
});
