import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { apiFetch } from '../api/client';
import { openGoogleSignIn } from '../auth/openGoogleSignIn';
import { Logo } from '../components/Logo';
import { Screen } from '../components/Screen';
import { AppInput } from '../components/ui/AppInput';
import { Card } from '../components/ui/Card';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import type { RootStackParamList } from '../navigation/types';

export function SignupScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { login, loginAsGuest } = useAuth();
  const { colors } = useTheme();
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
        setTimeout(() => navigation.replace('Login'), 2000);
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
              <Pressable
                onPress={async () => {
                  setError('');
                  try {
                    const payload = await openGoogleSignIn();
                    if (payload) await login(payload.token, payload.user);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Google sign-in failed');
                  }
                }}
                style={({ pressed }) => [
                  styles.outlineBtn,
                  { borderColor: colors.inputBorder, backgroundColor: colors.inputBg, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Icon name="google" size={16} color={colors.accent} />
                <Text style={{ color: colors.foreground, fontWeight: '600' }}>Sign up with Google</Text>
              </Pressable>
            </>
          )}

          <Text style={[styles.footer, { color: colors.muted }]}>
            Already have an account?{' '}
            <Text onPress={() => navigation.navigate('Login')} style={{ color: colors.accent }}>
              Log in
            </Text>
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
  outlineBtn: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  footer: { textAlign: 'center', fontSize: 14 },
});
