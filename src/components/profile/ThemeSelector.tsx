import { View, Text, Pressable, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useTheme, type ThemePreference } from '../../context/ThemeContext';

const OPTIONS: { id: ThemePreference; label: string; icon: string }[] = [
  { id: 'light', label: 'Light', icon: 'sun-o' },
  { id: 'dark', label: 'Dark', icon: 'moon-o' },
  { id: 'system', label: 'System', icon: 'mobile' },
];

export function ThemeSelector() {
  const { colors, themePreference, setThemePreference } = useTheme();

  return (
    <View style={[styles.wrap, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
      {OPTIONS.map((opt) => {
        const active = themePreference === opt.id;
        return (
          <Pressable
            key={opt.id}
            onPress={() => setThemePreference(opt.id)}
            style={[
              styles.option,
              active && { backgroundColor: colors.cardBg, borderColor: colors.accent },
              !active && { borderColor: 'transparent' },
            ]}
          >
            <Icon name={opt.icon} size={18} color={active ? colors.accent : colors.muted} />
            <Text style={[styles.label, { color: active ? colors.foreground : colors.muted }]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  label: { fontSize: 12, fontWeight: '600' },
});
