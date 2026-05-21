import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { openGoogleSignIn } from '../auth/openGoogleSignIn';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { Card } from '../components/ui/Card';
import { AppInput } from '../components/ui/AppInput';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { Logo } from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../api/client';
import { API_URL } from '../config/api';
import type { RootStackParamList } from '../navigation/types';

export function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { login, loginAsGuest } = useAuth();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const { ok, data } = await apiFetch<{ access_token?: string; user?: { id: string; email: string }; message?: string }>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify({ email, password }) },
      );
      if (ok && data.access_token && data.user) {
        await login(data.access_token, { id: String(data.user.id), email: data.user.email });
      } else {
        setError((data as { message?: string }).message || 'Login failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Connection error (${API_URL})`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <View style={styles.center}>
        <Card style={styles.card}>
          <View style={styles.header}>
            <Logo />
            <Text style={[styles.title, { color: colors.accent }]}>Welcome Back</Text>
            <Text style={{ color: colors.muted, fontSize: 14 }}>Login to your account</Text>
          </View>

          {error ? (
            <Text style={[styles.error, { color: colors.error, borderColor: colors.error }]}>{error}</Text>
          ) : null}

          <AppInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <AppInput label="Password" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
          <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.showPw}>
            <Text style={{ color: colors.muted, fontSize: 12 }}>{showPassword ? 'Hide' : 'Show'} password</Text>
          </Pressable>

          <PrimaryButton title="Sign In" onPress={handleSubmit} loading={loading} style={{ marginTop: 8 }} />

          <View style={styles.divider}>
            <View style={[styles.line, { backgroundColor: colors.cardBorder }]} />
            <Text style={{ color: colors.muted, fontSize: 12 }}>OR</Text>
            <View style={[styles.line, { backgroundColor: colors.cardBorder }]} />
          </View>

          <Pressable
            onPress={async () => {
              setError('');
              setGoogleLoading(true);
              try {
                await openGoogleSignIn();
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Could not open Google sign-in');
              } finally {
                setGoogleLoading(false);
              }
            }}
            disabled={googleLoading}
            style={[styles.outlineBtn, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg }]}
          >
            <Text style={{ color: colors.foreground, fontWeight: '500' }}>
              {googleLoading ? 'Opening browser…' : 'Continue with Google'}
            </Text>
          </Pressable>

          <Pressable onPress={loginAsGuest} style={[styles.guestBtn, { borderColor: colors.inputBorder }]}>
            <Text style={{ color: colors.muted, fontSize: 14 }}>Continue as Guest</Text>
          </Pressable>

          {/* <Text style={[styles.apiHint, { color: colors.muted }]} numberOfLines={2}>
            API: {API_URL}
          </Text> */}

          <Text style={[styles.footer, { color: colors.muted }]}>
            Don&apos;t have an account?{' '}
            <Text onPress={() => navigation.navigate('Signup')} style={{ color: colors.accent, fontWeight: '600' }}>
              Sign up
            </Text>
          </Text>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center' },
  card: { gap: 16, maxWidth: 440, width: '100%', alignSelf: 'center' },
  header: { alignItems: 'center', gap: 8 },
  title: { fontSize: 24, fontWeight: '700' },
  error: { padding: 12, borderRadius: 8, borderWidth: 1, fontSize: 14 },
  showPw: { alignSelf: 'flex-end', marginTop: -8 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  line: { flex: 1, height: 1 },
  outlineBtn: { padding: 12, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  guestBtn: { padding: 12, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center' },
  apiHint: { textAlign: 'center', fontSize: 10, fontFamily: 'monospace' },
  footer: { textAlign: 'center', fontSize: 14, marginTop: 8 },
});
