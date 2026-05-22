import { View, Text, Pressable, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useTheme } from '../../context/ThemeContext';

type SettingRowProps = {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  disabled?: boolean;
  showChevron?: boolean;
  rightElement?: React.ReactNode;
};

export function SettingRow({
  icon,
  label,
  value,
  onPress,
  destructive,
  disabled,
  showChevron = !!onPress,
  rightElement,
}: SettingRowProps) {
  const { colors } = useTheme();
  const labelColor = destructive ? colors.error : disabled ? colors.muted : colors.foreground;

  const content = (
    <>
      <View style={[styles.iconWrap, { backgroundColor: colors.surface }]}>
        <Icon name={icon} size={16} color={destructive ? colors.error : colors.accent} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
        {value ? <Text style={[styles.value, { color: colors.muted }]} numberOfLines={1}>{value}</Text> : null}
      </View>
      {rightElement}
      {showChevron && onPress && !rightElement ? (
        <Icon name="chevron-right" size={12} color={colors.muted} />
      ) : null}
    </>
  );

  if (onPress && !disabled) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.row,
          { borderColor: colors.cardBorder, backgroundColor: pressed ? colors.surfaceHover : colors.cardBg },
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[styles.row, { borderColor: colors.cardBorder, backgroundColor: colors.cardBg, opacity: disabled ? 0.55 : 1 }]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
  label: { fontSize: 15, fontWeight: '600' },
  value: { fontSize: 13 },
});
