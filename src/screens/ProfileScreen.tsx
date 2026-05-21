import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Screen } from '../components/Screen';
import { Card } from '../components/ui/Card';
import { AppInput } from '../components/ui/AppInput';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { DashboardHeader } from '../components/DashboardHeader';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../api/client';

interface ProfileData {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  isGoogleUser?: boolean;
}

export function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const { colors } = useTheme();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (!token) return;
    apiFetch<ProfileData>('/users/me', { token }).then(({ ok, data }) => {
      if (ok) {
        setProfile(data);
        setFullName(data.fullName || '');
        setPhoneNumber(data.phoneNumber || '');
      }
    });
  }, [token]);

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    setMsg(null);
    const { ok, data } = await apiFetch<ProfileData>('/users/me', {
      method: 'PATCH',
      token,
      body: JSON.stringify({ fullName, phoneNumber }),
    });
    if (ok) {
      setProfile(data);
      setEditing(false);
      setMsg({ type: 'ok', text: 'Profile updated.' });
    } else {
      setMsg({ type: 'err', text: 'Failed to save.' });
    }
    setSaving(false);
    setTimeout(() => setMsg(null), 4000);
  };

  const initials = (profile?.fullName || user?.email || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Screen scroll>
      <DashboardHeader />
      <Card style={{ alignItems: 'center', gap: 12 }}>
        <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
          <Text style={{ fontWeight: '700', color: colors.primaryText, fontSize: 20 }}>{initials}</Text>
        </View>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground }}>{profile?.fullName || 'Profile'}</Text>
        <Text style={{ color: colors.muted }}>{profile?.email || user?.email}</Text>
      </Card>

      <Card style={{ marginTop: 16, gap: 12 }}>
        {editing ? (
          <>
            <AppInput label="Full Name" value={fullName} onChangeText={setFullName} />
            <AppInput label="Phone" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
            <PrimaryButton title="Save" onPress={handleSave} loading={saving} />
            <Pressable onPress={() => setEditing(false)}>
              <Text style={{ color: colors.muted, textAlign: 'center' }}>Cancel</Text>
            </Pressable>
          </>
        ) : (
          <>
            <View style={styles.row}>
              <Text style={{ color: colors.muted }}>Phone</Text>
              <Text style={{ color: colors.foreground }}>{profile?.phoneNumber || '—'}</Text>
            </View>
            <Pressable onPress={() => setEditing(true)}>
              <Text style={{ color: colors.accent, fontWeight: '600' }}>Edit Profile</Text>
            </Pressable>
          </>
        )}
        {msg && (
          <Text style={{ color: msg.type === 'ok' ? colors.success : colors.error, fontSize: 13 }}>{msg.text}</Text>
        )}
      </Card>

      <Pressable onPress={logout} style={[styles.logout, { borderColor: colors.cardBorder }]}>
        <Text style={{ color: colors.error, fontWeight: '600' }}>Sign Out</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  logout: { marginTop: 24, padding: 14, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
});
