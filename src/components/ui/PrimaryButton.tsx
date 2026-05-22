import { Pressable, Text, StyleSheet, ActivityIndicator, type PressableProps } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export function PrimaryButton({
  title,
  loading,
  disabled,
  style,
  ...props
}: PressableProps & { title: string; loading?: boolean }) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;
  return (
    <Pressable
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: colors.accent, opacity: isDisabled ? 0.6 : pressed ? 0.9 : 1 },
        style,
      ]}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={colors.primaryText} />
      ) : (
        <Text style={[styles.text, { color: colors.primaryText }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontWeight: '600', fontSize: 14 },
});
