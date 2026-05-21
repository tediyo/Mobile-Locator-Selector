import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Logo } from './Logo';
import Icon from 'react-native-vector-icons/FontAwesome';

export function DashboardHeader() {
  const { user, isGuest, logout } = useAuth();
  const { theme, colors, toggleTheme } = useTheme();

  return (
    <View style={styles.wrap}>
      <View style={styles.top}>
        <Logo size="sm" />
        <Text style={[styles.welcome, { color: colors.muted }]}>
          {isGuest ? 'Welcome, Guest' : `Welcome back, ${user?.email}`}
        </Text>
      </View>
      <View style={styles.actions}>
        <Pressable onPress={toggleTheme} style={[styles.iconBtn, { borderColor: colors.cardBorder, backgroundColor: colors.surface }]}>
          <Icon name={theme === 'dark' ? 'sun-o' : 'moon-o'} size={16} color={colors.muted} />
        </Pressable>
        {isGuest ? (
          <Pressable onPress={logout}>
            <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '500' }}>Sign Out</Text>
          </Pressable>
        ) : null}
      </View>
      {isGuest && (
        <View style={[styles.guestBanner, { backgroundColor: colors.badgeBg, borderColor: colors.cardBorder }]}>
          <Text style={{ color: colors.tagText, fontSize: 13, flex: 1 }}>
            👤 Guest mode — sign up to save search history.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12, marginBottom: 16 },
  top: { gap: 4 },
  welcome: { fontSize: 14 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestBanner: { padding: 12, borderRadius: 12, borderWidth: 1 },
});
