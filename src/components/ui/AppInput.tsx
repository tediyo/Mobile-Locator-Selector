import { TextInput, View, Text, StyleSheet, type TextInputProps } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export function AppInput({
  label,
  optional,
  containerStyle,
  ...props
}: TextInputProps & { label: string; optional?: boolean; containerStyle?: object }) {
  const { colors } = useTheme();
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
            borderColor: colors.inputBorder,
            color: colors.foreground,
          },
        ]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 14, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
});
