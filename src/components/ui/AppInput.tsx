import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { fontSize, fontWeight, radius, spacing } from '../../theme/tokens';

export function AppInput({
  label,
  optional,
  containerStyle,
  onFocus,
  onBlur,
  ...props
}: TextInputProps & { label: string; optional?: boolean; containerStyle?: object }) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.wrap, containerStyle]}>
      <Text style={[styles.label, { color: colors.mutedStrong }]}>
        {label}
        {optional ? <Text style={{ color: colors.muted }}> (optional)</Text> : null}
      </Text>
      <TextInput
        placeholderTextColor={colors.muted}
        style={[
          styles.input,
          {
            backgroundColor: colors.inputBg,
            borderColor: focused ? colors.accent : colors.inputBorder,
            color: colors.foreground,
          },
        ]}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs + 2 },
  label: { fontSize: fontSize.md, fontWeight: fontWeight.medium },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 1,
    fontSize: fontSize.md,
    minHeight: 46,
  },
});
