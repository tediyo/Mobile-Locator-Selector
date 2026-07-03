import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useTheme, type ThemePreference } from '../../context/ThemeContext';

const OPTIONS: { id: ThemePreference; label: string; icon: string }[] = [
  { id: 'light', label: 'Light', icon: 'sun-o' },
  { id: 'dark', label: 'Dark', icon: 'moon-o' },
  { id: 'system', label: 'System', icon: 'mobile' },
];

export function ThemeSelector() {
  const { colors, themePreference, setThemePreference } = useTheme();
  const [open, setOpen] = useState(false);
  const selected = OPTIONS.find((opt) => opt.id === themePreference) ?? OPTIONS[2];

  return (
    <View>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        style={[styles.trigger, { borderColor: colors.cardBorder, backgroundColor: colors.surface }]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name={selected.icon} size={18} color={colors.accent} />
          <Text style={[styles.selectedLabel, { color: colors.foreground }]}>{selected.label}</Text>
        </View>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={14} color={colors.muted} />
      </Pressable>

      {open && (
        <View style={[styles.menu, { borderColor: colors.cardBorder, backgroundColor: colors.surface }]}>
          {OPTIONS.map((opt) => {
            const active = themePreference === opt.id;
            return (
              <Pressable
                key={opt.id}
                onPress={() => {
                  setThemePreference(opt.id);
                  setOpen(false);
                }}
                style={[styles.item, active && { backgroundColor: colors.cardBg }]}
              >
                <Icon name={opt.icon} size={18} color={active ? colors.accent : colors.muted} />
                <Text style={[styles.itemLabel, { color: active ? colors.foreground : colors.muted }]}>{opt.label}</Text>
                {active && <Icon name="check" size={14} color={colors.accent} />}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  selectedLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  menu: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  itemLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
});
