import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Screen } from '../components/Screen';
import { Card } from '../components/ui/Card';
import { AppInput } from '../components/ui/AppInput';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { DashboardHeader } from '../components/DashboardHeader';
import { ProfileSection } from '../components/profile/ProfileSection';
import { SettingRow } from '../components/profile/SettingRow';
import { ThemeSelector } from '../components/profile/ThemeSelector';
import { InfoRow } from '../components/profile/InfoRow';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { API_URL } from '../config/api';
import { apiFetch } from '../api/client';

interface ProfileData {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  isGoogleUser?: boolean;
  createdAt?: string;
}

function formatMemberSince(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', year: 'numeric', day: 'numeric' });
  } catch {
    return '—';
  }
}

export function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const { colors, theme, themePreference } = useTheme();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    apiFetch<ProfileData>('/users/me', { token }).then(({ ok, data }) => {
      if (ok) {
        setProfile(data);
        setFullName(data.fullName || '');
        setPhoneNumber(data.phoneNumber || '');
      }
      setLoading(false);
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
      setMsg({ type: 'ok', text: 'Profile updated successfully.' });
    } else {
      setMsg({ type: 'err', text: 'Failed to save profile.' });
    }
    setSaving(false);
    setTimeout(() => setMsg(null), 4000);
  };

  const cancelEdit = () => {
    setFullName(profile?.fullName || '');
    setPhoneNumber(profile?.phoneNumber || '');
    setEditing(false);
    setMsg(null);
  };

  const confirmSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logout },
    ]);
  };

  const initials = (profile?.fullName || user?.email || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const accountType = profile?.isGoogleUser ? 'Google' : 'Email & password';
  const themeLabel =
    themePreference === 'system' ? `System (${theme})` : themePreference === 'dark' ? 'Dark' : 'Light';

  return (
    <Screen scroll>
      <DashboardHeader />

      <Text style={[styles.pageTitle, { color: colors.foreground }]}>Profile & Settings</Text>
      <Text style={[styles.pageSubtitle, { color: colors.muted }]}>
        Manage your account, appearance, and preferences
      </Text>

      {/* Profile hero */}
      <Card style={styles.heroCard}>
        <View style={styles.heroRow}>
          <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
            <Text style={{ fontWeight: '700', color: colors.primaryText, fontSize: 22 }}>{initials}</Text>
          </View>
          <View style={styles.heroText}>
            <Text style={[styles.heroName, { color: colors.foreground }]}>
              {loading ? 'Loading…' : profile?.fullName || 'Your profile'}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 14 }} numberOfLines={1}>
              {profile?.email || user?.email}
            </Text>
            <View style={[styles.badge, { backgroundColor: colors.badgeBg, borderColor: colors.cardBorder }]}>
              <Icon
                name={profile?.isGoogleUser ? 'google' : 'envelope'}
                size={11}
                color={colors.badgeText}
              />
              <Text style={[styles.badgeText, { color: colors.badgeText }]}>{accountType}</Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Basic profile */}
      <ProfileSection title="Basic profile information" subtitle="Your personal details">
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {editing ? (
            <View style={styles.editBlock}>
              <AppInput label="Full name" value={fullName} onChangeText={setFullName} />
              <AppInput
                label="Phone number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                optional
              />
              <Text style={[styles.hint, { color: colors.muted }]}>
                Email cannot be changed here. Contact support if you need to update it.
              </Text>
              <PrimaryButton title="Save changes" onPress={handleSave} loading={saving} />
              <Pressable onPress={cancelEdit}>
                <Text style={{ color: colors.muted, textAlign: 'center', fontWeight: '500' }}>Cancel</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.infoBlock}>
              <InfoRow label="Full name" value={profile?.fullName || '—'} />
              <InfoRow label="Email" value={profile?.email || user?.email || '—'} />
              <InfoRow label="Phone" value={profile?.phoneNumber || '—'} />
              <InfoRow label="User ID" value={profile?.id ? `#${profile.id.slice(-8)}` : '—'} />
              <Pressable onPress={() => setEditing(true)} style={styles.editLink}>
                <Icon name="pencil" size={14} color={colors.accent} />
                <Text style={{ color: colors.accent, fontWeight: '600' }}>Edit profile</Text>
              </Pressable>
            </View>
          )}
          {msg ? (
            <Text
              style={[
                styles.banner,
                { color: msg.type === 'ok' ? colors.success : colors.error },
              ]}
            >
              {msg.text}
            </Text>
          ) : null}
        </Card>
      </ProfileSection>

      {/* Settings */}
      <ProfileSection title="Settings" subtitle="Appearance and app preferences">
        <Card style={{ gap: 14 }}>
          <View style={styles.settingBlock}>
            <View style={styles.settingLabelRow}>
              <Icon name="paint-brush" size={14} color={colors.accent} />
              <Text style={[styles.settingLabel, { color: colors.foreground }]}>Theme</Text>
            </View>
            <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 4 }}>
              Current: {themeLabel}
            </Text>
            <ThemeSelector />
          </View>
        </Card>

        <View style={{ gap: 8, marginTop: 4 }}>
          <SettingRow
            icon="bell-o"
            label="Notifications"
            value="Coming soon"
            disabled
            showChevron={false}
          />
          <SettingRow
            icon="globe"
            label="API server"
            value={API_URL.replace(/^https?:\/\//, '').slice(0, 32)}
            disabled
            showChevron={false}
          />
        </View>
      </ProfileSection>

      {/* Account management */}
      <ProfileSection title="Account management" subtitle="Security and session">
        <View style={{ gap: 8 }}>
          <SettingRow icon="id-card-o" label="Sign-in method" value={accountType} showChevron={false} />
          <SettingRow
            icon="calendar-o"
            label="Member since"
            value={formatMemberSince(profile?.createdAt)}
            showChevron={false}
          />
          {!profile?.isGoogleUser ? (
            <SettingRow
              icon="lock"
              label="Change password"
              value="Use web app or contact admin"
              onPress={() =>
                Alert.alert(
                  'Change password',
                  'Password changes are handled on the web dashboard for now.',
                )
              }
            />
          ) : null}
          <SettingRow icon="sign-out" label="Sign out" onPress={confirmSignOut} destructive showChevron={false} />
        </View>
      </ProfileSection>

      <Text style={[styles.footer, { color: colors.muted }]}>TWT Locator · v1.0.0</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pageTitle: { fontSize: 24, fontWeight: '700', marginTop: 4 },
  pageSubtitle: { fontSize: 14, marginTop: 4, marginBottom: 4 },
  heroCard: { marginTop: 12 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { flex: 1, gap: 4 },
  heroName: { fontSize: 20, fontWeight: '700' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },
  infoBlock: { paddingHorizontal: 16, paddingBottom: 8 },
  editBlock: { padding: 16, gap: 12 },
  editLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  hint: { fontSize: 12, lineHeight: 18 },
  banner: { fontSize: 13, textAlign: 'center', paddingHorizontal: 16, paddingBottom: 12 },
  settingBlock: { gap: 8 },
  settingLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingLabel: { fontSize: 15, fontWeight: '600' },
  footer: { textAlign: 'center', fontSize: 11, marginTop: 28, marginBottom: 32 },
});
