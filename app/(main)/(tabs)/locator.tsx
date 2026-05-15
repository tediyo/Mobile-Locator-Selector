import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as Clipboard from 'expo-clipboard';
import { Screen } from '@/src/components/Screen';
import { Card } from '@/src/components/ui/Card';
import { AppInput } from '@/src/components/ui/AppInput';
import { PrimaryButton } from '@/src/components/ui/PrimaryButton';
import { DashboardHeader } from '@/src/components/DashboardHeader';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { apiFetch } from '@/src/api/client';
import { LOCATOR_TYPES, generateSnippet, type Framework } from '@/src/lib/locator-snippets';

interface LocatorResult {
  tag: string;
  locator: string;
}

export default function LocatorScreen() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const [url, setUrl] = useState('');
  const [keyword, setKeyword] = useState('');
  const [locatorType, setLocatorType] = useState('xpath');
  const [cookies, setCookies] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [siteUsername, setSiteUsername] = useState('');
  const [sitePassword, setSitePassword] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const [results, setResults] = useState<LocatorResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authWarning, setAuthWarning] = useState<string | null>(null);
  const [framework, setFramework] = useState<Framework>('playwright');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setResults([]);
    setAuthWarning(null);
    try {
      const { ok, data } = await apiFetch<LocatorResult[] | { warning?: string; hint?: string; results?: [] }>(
        '/locator/generate',
        {
          method: 'POST',
          token,
          body: JSON.stringify({
            url,
            keyword,
            locatorType,
            cookies: cookies || undefined,
            authToken: authToken || undefined,
            siteUsername: siteUsername || undefined,
            sitePassword: sitePassword || undefined,
          }),
        },
      );
      if (ok) {
        if (Array.isArray(data)) {
          setResults(data);
        } else if (data && typeof data === 'object' && 'warning' in data) {
          setAuthWarning(`${data.warning}\n${data.hint ?? ''}`);
          setShowAuth(true);
        }
      } else {
        setError('Generation failed');
      }
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const copyText = async (text: string, idx: number) => {
    await Clipboard.setStringAsync(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <Screen scroll>
      <DashboardHeader />
      <Card style={{ gap: 14 }}>
        <AppInput label="Target URL" value={url} onChangeText={setUrl} placeholder="https://example.com" autoCapitalize="none" />
        <AppInput label="Keyword" value={keyword} onChangeText={setKeyword} placeholder="e.g. Email" />
        <Text style={[styles.label, { color: colors.muted }]}>COPY AS</Text>
        <View style={[styles.pickerWrap, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg }]}>
          <Picker selectedValue={locatorType} onValueChange={setLocatorType} style={{ color: colors.foreground }}>
            {LOCATOR_TYPES.map((t) => (
              <Picker.Item key={t.value} label={t.label} value={t.value} color={colors.foreground} />
            ))}
          </Picker>
        </View>

        <Pressable onPress={() => setShowAuth(!showAuth)}>
          <Text style={{ color: colors.accent, fontSize: 13, fontWeight: '500' }}>
            {showAuth ? '▼' : '▶'} Authentication (protected pages)
          </Text>
        </Pressable>
        {showAuth && (
          <View style={{ gap: 10 }}>
            <AppInput label="Cookies" value={cookies} onChangeText={setCookies} placeholder="name=value; ..." />
            <AppInput label="Auth Token" value={authToken} onChangeText={setAuthToken} />
            <AppInput label="Site Username" value={siteUsername} onChangeText={setSiteUsername} />
            <AppInput label="Site Password" value={sitePassword} onChangeText={setSitePassword} secureTextEntry />
          </View>
        )}

        <PrimaryButton title={loading ? 'Generating…' : 'Generate Locators'} onPress={handleGenerate} loading={loading} disabled={!url || !keyword} />

        {error ? <Text style={{ color: colors.error }}>{error}</Text> : null}
        {authWarning ? <Text style={{ color: colors.tagText, fontSize: 13 }}>{authWarning}</Text> : null}
      </Card>

      {results.length > 0 && (
        <View style={{ marginTop: 16, gap: 12 }}>
          <View style={[styles.fwRow, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            {(['playwright', 'cypress', 'selenium'] as Framework[]).map((fw) => (
              <Pressable
                key={fw}
                onPress={() => setFramework(fw)}
                style={[styles.fwBtn, framework === fw && { backgroundColor: colors.accent }]}
              >
                <Text style={{ fontSize: 11, fontWeight: '600', color: framework === fw ? colors.primaryText : colors.muted, textTransform: 'capitalize' }}>
                  {fw}
                </Text>
              </Pressable>
            ))}
          </View>
          {results.map((res, idx) => (
            <Card key={idx} style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.tag, { backgroundColor: colors.tagBg }]}>
                  <Text style={{ color: colors.tagText, fontSize: 11, fontFamily: 'monospace' }}>{res.tag}</Text>
                </View>
                <Pressable
                  onPress={() => copyText(res.locator, idx)}
                  style={[styles.copyBtn, { backgroundColor: copiedIdx === idx ? colors.accent : colors.copyBtnBg }]}
                >
                  <Text style={{ fontSize: 11, color: copiedIdx === idx ? colors.primaryText : colors.copyBtnText }}>
                    {copiedIdx === idx ? '✓ Copied' : 'Copy'}
                  </Text>
                </Pressable>
              </View>
              <Text style={{ fontFamily: 'monospace', fontSize: 12, color: colors.mutedStrong }} selectable>
                {res.locator}
              </Text>
              <Text style={{ fontSize: 10, color: colors.muted, fontWeight: '700' }}>{framework.toUpperCase()} SNIPPET</Text>
              <ScrollView horizontal>
                <Text style={{ fontFamily: 'monospace', fontSize: 10, color: colors.mutedStrong }} selectable>
                  {generateSnippet(locatorType, res.locator, framework, res.tag)}
                </Text>
              </ScrollView>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  pickerWrap: { borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  fwRow: { flexDirection: 'row', borderRadius: 8, borderWidth: 1, padding: 2 },
  fwBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  copyBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginLeft: 'auto' },
});
