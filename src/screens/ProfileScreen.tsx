import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { apiFetch } from '../api/client';
import { DashboardHeader } from '../components/DashboardHeader';
import { InfoRow } from '../components/profile/InfoRow';
import { ProfileAvatar } from '../components/profile/ProfileAvatar';
import { ProfileSection } from '../components/profile/ProfileSection';
import { SettingRow } from '../components/profile/SettingRow';
import { ThemeSelector } from '../components/profile/ThemeSelector';
import { Screen } from '../components/Screen';
import { AppInput } from '../components/ui/AppInput';
import { Card } from '../components/ui/Card';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import type { ProfileData } from '../context/UserDataContext';
import { useUserData } from '../context/UserDataContext';
import { resolveProfilePictureUrl } from '../lib/profilePicture';

export function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const { colors, theme, themePreference } = useTheme();
  const { profile, profileLoading, setProfileCache, refreshProfile } = useUserData();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setPhoneNumber(profile.phoneNumber || '');
      setLoadError('');
    }
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      setLoadError('');
      refreshProfile(true).catch(() => {
        setLoadError('Could not load profile. Pull down to retry.');
      });
    }, [token, refreshProfile]),
  );

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
      setProfileCache({
        ...data,
        createdAt: profile?.createdAt ?? data.createdAt,
        pictureUrl:
          profile?.pictureUrl ??
          resolveProfilePictureUrl(data as unknown as Record<string, unknown>),
      });
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

  const pictureUrl = profile?.pictureUrl ?? user?.picture ?? null;

  const themeLabel =
    themePreference === 'system' ? `System (${theme})` : themePreference === 'dark' ? 'Dark' : 'Light';

  return (
    <Screen scroll>
      <DashboardHeader />

     
   

      {/* Profile hero */}
      <Card style={styles.heroCard}>
        <View style={styles.heroRow}>
          <ProfileAvatar
            name={profile?.fullName}
            email={profile?.email || user?.email}
            pictureUrl={pictureUrl}
            size={80}
          />
          <View style={styles.heroText}>
            <Text style={[styles.heroName, { color: colors.foreground }]}>
              {profileLoading && !profile ? 'Loading…' : profile?.fullName || 'Your profile'}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 14 }} numberOfLines={1}>
              {profile?.email || user?.email}
            </Text>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: colors.badgeBg, borderColor: colors.cardBorder }]}>
                <Icon
                  name={profile?.isGoogleUser ? 'google' : 'envelope'}
                  size={11}
                  color={colors.badgeText}
                />
                <Text style={[styles.badgeText, { color: colors.badgeText }]}>
                  {profile?.isGoogleUser ? 'Google' : 'Email'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Card>

      {/* Basic profile */}
      <ProfileSection title="Basic profile information" subtitle="Your personal details">
        {loadError ? (
          <Text style={{ color: colors.error, fontSize: 13, marginBottom: 8 }}>{loadError}</Text>
        ) : null}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {profileLoading && !profile ? (
            <Text style={[styles.loading, { color: colors.muted }]}>Loading profile…</Text>
          ) : editing ? (
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

      {/* Theme */}
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

      {/* Account management */}
      <View style={{ gap: 8 }}>
        {!profile?.isGoogleUser ? (
          <SettingRow
            icon="lock"
            label="Change password"
            value="Unavailable"
            onPress={() =>
              Alert.alert(
                'Change password',
                'Unavailable',
              )
            }
          />
        ) : null}
        <SettingRow icon="sign-out" label="Sign out" onPress={confirmSignOut} destructive showChevron={false} />
      </View>

      <Text style={[styles.footer, { color: colors.muted }]}>TWT Locator · v1.0.0</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pageTitle: { fontSize: 24, fontWeight: '700', marginTop: 4 },
  pageSubtitle: { fontSize: 14, marginTop: 4, marginBottom: 4 },
  heroCard: { marginTop: 12 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  heroText: { flex: 1, gap: 4 },
  heroName: { fontSize: 20, fontWeight: '700' },
  badgeRow: { marginTop: 6, gap: 4 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },
  infoBlock: { paddingHorizontal: 16, paddingBottom: 8 },
  editBlock: { padding: 16, gap: 12 },
  loading: { padding: 20, textAlign: 'center', fontSize: 14 },
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
