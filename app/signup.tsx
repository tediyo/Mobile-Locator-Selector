import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Screen } from '@/src/components/Screen';
import { Card } from '@/src/components/ui/Card';
import { AppInput } from '@/src/components/ui/AppInput';
import { PrimaryButton } from '@/src/components/ui/PrimaryButton';
import { Logo } from '@/src/components/Logo';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { apiFetch } from '@/src/api/client';
import { API_URL } from '@/src/config/api';

export default function SignupScreen() {
  const { loginAsGuest } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const { ok, data } = await apiFetch<{ message?: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ fullName, email, phoneNumber: phoneNumber || undefined, password }),
      });
      if (ok) {
        setSuccess(true);
        setTimeout(() => router.replace('/login'), 2000);
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection error');
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
            <Text style={[styles.title, { color: colors.accent }]}>Create Account</Text>
            <Text style={{ color: colors.muted, fontSize: 14 }}>Join us today</Text>
          </View>

          {error ? <Text style={[styles.banner, { color: colors.error }]}>{error}</Text> : null}
          {success ? <Text style={[styles.banner, { color: colors.success }]}>Account created! Redirecting…</Text> : null}

          {!success && (
            <>
              <AppInput label="Full Name" value={fullName} onChangeText={setFullName} />
              <AppInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
              <AppInput label="Phone Number" optional value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
              <AppInput label="Password" value={password} onChangeText={setPassword} secureTextEntry />
              <PrimaryButton title="Sign Up" onPress={handleSubmit} loading={loading} />
              <Pressable onPress={() => Linking.openURL(`${API_URL}/auth/google`)} style={[styles.outlineBtn, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg }]}>
                <Text style={{ color: colors.foreground }}>Sign up with Google</Text>
              </Pressable>
            </>
          )}

          <Text style={[styles.footer, { color: colors.muted }]}>
            Already have an account? <Link href="/login" style={{ color: colors.accent }}>Log in</Link>
          </Text>
          <Pressable onPress={loginAsGuest}>
            <Text style={{ color: colors.accent, textAlign: 'center', fontSize: 14 }}>Continue as Guest</Text>
          </Pressable>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', paddingVertical: 24 },
  card: { gap: 14 },
  header: { alignItems: 'center', gap: 8 },
  title: { fontSize: 24, fontWeight: '700' },
  banner: { fontSize: 14, textAlign: 'center' },
  outlineBtn: { padding: 12, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  footer: { textAlign: 'center', fontSize: 14 },
});
