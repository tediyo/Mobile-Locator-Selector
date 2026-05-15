import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import { Link } from 'expo-router';
import { Screen } from '@/src/components/Screen';
import { Card } from '@/src/components/ui/Card';
import { AppInput } from '@/src/components/ui/AppInput';
import { PrimaryButton } from '@/src/components/ui/PrimaryButton';
import { Logo } from '@/src/components/Logo';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { apiFetch } from '@/src/api/client';
import { API_URL } from '@/src/config/api';

export default function LoginScreen() {
  const { login, loginAsGuest } = useAuth();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => Linking.openURL(`${API_URL}/auth/google`);

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
          <AppInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
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
            onPress={handleGoogle}
            style={[styles.outlineBtn, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg }]}
          >
            <Text style={{ color: colors.foreground, fontWeight: '500' }}>Continue with Google</Text>
          </Pressable>

          <Pressable
            onPress={loginAsGuest}
            style={[styles.guestBtn, { borderColor: colors.inputBorder }]}
          >
            <Text style={{ color: colors.muted, fontSize: 14 }}>Continue as Guest</Text>
          </Pressable>

          <Text style={[styles.footer, { color: colors.muted }]}>
            Don&apos;t have an account?{' '}
            <Link href="/signup" style={{ color: colors.accent, fontWeight: '600' }}>
              Sign up
            </Link>
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
  footer: { textAlign: 'center', fontSize: 14, marginTop: 8 },
});
