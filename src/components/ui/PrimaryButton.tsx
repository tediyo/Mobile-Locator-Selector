import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { fontSize, fontWeight, radius, shadow, spacing } from '../../theme/tokens';

export function PrimaryButton({
  title,
  loading,
  disabled,
  variant = 'solid',
  style,
  ...props
}: PressableProps & { title: string; loading?: boolean; variant?: 'solid' | 'outline' }) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;
  const isOutline = variant === 'outline';
  const textColor = isOutline ? colors.foreground : colors.primaryText;
  const variantStyle = isOutline
    ? { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.inputBorder }
    : { backgroundColor: colors.accent, ...shadow('sm', colors.accent) };
  return (
    <Pressable
      style={({ pressed }) => [
        styles.btn,
        variantStyle,
        { opacity: isDisabled ? 0.5 : pressed ? 0.92 : 1 },
        style as object,
      ]}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  text: { fontWeight: fontWeight.semibold, fontSize: fontSize.md, letterSpacing: 0.2 },
});
