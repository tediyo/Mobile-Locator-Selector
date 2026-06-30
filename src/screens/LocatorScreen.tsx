import Clipboard from '@react-native-clipboard/clipboard';
import { Picker } from '@react-native-picker/picker';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { apiFetch } from '../api/client';
import { DashboardHeader } from '../components/DashboardHeader';
import { Screen } from '../components/Screen';
import { AppInput } from '../components/ui/AppInput';
import { Card } from '../components/ui/Card';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useUserData } from '../context/UserDataContext';
import { LOCATOR_TYPES, generateSnippet, type Framework } from '../lib/locator-snippets';
import type { MainTabParamList } from '../navigation/types';
import { monoFont } from '../theme/tokens';

interface LocatorResult {
  tag: string;
  locator: string;
}

export function LocatorScreen() {
  const { token } = useAuth();
  const { invalidateHistory, refreshHistory } = useUserData();
  const { colors } = useTheme();
  const route = useRoute<RouteProp<MainTabParamList, 'Locator'>>();
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
  const lastRerunKey = useRef<string | null>(null);

  const handleGenerate = useCallback(
    async (override?: { url?: string; keyword?: string; locatorType?: string }) => {
      const reqUrl = override?.url ?? url;
      const reqKeyword = override?.keyword ?? keyword;
      const reqType = override?.locatorType ?? locatorType;
      if (!reqUrl || !reqKeyword) return;
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
              url: reqUrl,
              keyword: reqKeyword,
              locatorType: reqType,
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
            invalidateHistory();
            refreshHistory(true);
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
    },
    [url, keyword, locatorType, cookies, authToken, siteUsername, sitePassword, token, invalidateHistory, refreshHistory],
  );

  useEffect(() => {
    const params = route.params;
    if (!params?.url) return;
    const key = `${params.url}|${params.keyword ?? ''}|${params.locatorType ?? ''}`;
    if (lastRerunKey.current === key) return;
    lastRerunKey.current = key;

    setUrl(params.url);
    if (params.keyword) setKeyword(params.keyword);
    if (params.locatorType) setLocatorType(params.locatorType);
    if (params.autoRun) {
      handleGenerate({ url: params.url, keyword: params.keyword, locatorType: params.locatorType });
    }
  }, [route.params, handleGenerate]);

  const copyText = (text: string, idx: number) => {
    Clipboard.setString(text);
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

        <PrimaryButton title={loading ? 'Generating…' : 'Generate Locators'} onPress={() => handleGenerate()} loading={loading} disabled={!url || !keyword} />

        {error ? <Text style={{ color: colors.error }}>{error}</Text> : null}
        {authWarning ? <Text style={{ color: colors.tagText, fontSize: 13 }}>{authWarning}</Text> : null}
      </Card>

      {results.length > 0 && (
        <View style={{ marginTop: 16, gap: 12 }}>
          <SegmentedControl
            value={framework}
            onChange={setFramework}
            capitalize
            dense
            options={[
              { value: 'playwright', label: 'Playwright' },
              { value: 'cypress', label: 'Cypress' },
              { value: 'selenium', label: 'Selenium' },
            ]}
          />
          {results.map((res, idx) => (
            <Card key={idx} style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.tag, { backgroundColor: colors.tagBg }]}>
                  <Text style={{ color: colors.tagText, fontSize: 11, fontFamily: monoFont }}>{res.tag}</Text>
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
              <Text style={{ fontFamily: monoFont, fontSize: 12, color: colors.mutedStrong }} selectable>
                {res.locator}
              </Text>
              <Text style={{ fontSize: 10, color: colors.muted, fontWeight: '700' }}>{framework.toUpperCase()} SNIPPET</Text>
              <ScrollView horizontal>
                <Text style={{ fontFamily: monoFont, fontSize: 10, color: colors.mutedStrong }} selectable>
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
  tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  copyBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginLeft: 'auto' },
});
