import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fontSize, fontWeight, radius, spacing } from '../theme/tokens';
import { Logo } from './Logo';

export function DashboardHeader() {
  const { user, isGuest, logout } = useAuth();
  const { theme, colors, toggleTheme } = useTheme();

  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        <View style={styles.left}>
          <Logo size="sm" />
          <Text style={[styles.welcome, { color: colors.muted }]} numberOfLines={1}>
            {isGuest ? 'Welcome, Guest' : `Welcome back, ${user?.email}`}
          </Text>
        </View>
        <View style={styles.actions}>
          <Pressable
            onPress={toggleTheme}
            style={[styles.iconBtn, { borderColor: colors.cardBorder, backgroundColor: colors.surface }]}
          >
            <Icon name={theme === 'dark' ? 'sun-o' : 'moon-o'} size={16} color={colors.mutedStrong} />
          </Pressable>
          {isGuest ? (
            <Pressable
              onPress={logout}
              style={[styles.signOut, { borderColor: colors.cardBorder, backgroundColor: colors.surface }]}
            >
              <Text style={{ color: colors.mutedStrong, fontSize: fontSize.xs, fontWeight: fontWeight.semibold }}>
                Sign out
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      {isGuest && (
        <View style={[styles.guestBanner, { backgroundColor: colors.accentSoft, borderColor: colors.cardBorder }]}>
          <Icon name="user-circle-o" size={15} color={colors.tagText} />
          <Text style={{ color: colors.tagText, fontSize: fontSize.sm, flex: 1 }}>
            Guest mode — sign up to save your search history.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md, marginBottom: spacing.lg },
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  left: { flex: 1, gap: 2 },
  welcome: { fontSize: fontSize.sm },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOut: {
    height: 38,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
});
