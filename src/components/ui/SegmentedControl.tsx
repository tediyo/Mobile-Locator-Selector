import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { radius, spacing, fontSize, fontWeight } from '../../theme/tokens';

export type SegmentOption<T extends string> = { value: T; label: string };

type SegmentedControlProps<T extends string> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Capitalize the label text */
  capitalize?: boolean;
  /** Smaller, denser segments */
  dense?: boolean;
  style?: object;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  capitalize,
  dense,
  style,
}: SegmentedControlProps<T>) {
  const { colors } = useTheme();

  return (
    <View style={[styles.wrap, { backgroundColor: colors.surface, borderColor: colors.cardBorder }, style]}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={({ pressed }) => [
              styles.segment,
              dense && styles.segmentDense,
              active && { backgroundColor: colors.accent },
              !active && pressed && { backgroundColor: colors.surfaceHover },
            ]}
          >
            <Text
              style={[
                styles.label,
                dense && { fontSize: fontSize.xs },
                capitalize && styles.capitalize,
                { color: active ? colors.primaryText : colors.muted },
              ]}
              numberOfLines={1}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 3,
    gap: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm + 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  segmentDense: { paddingVertical: spacing.sm },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  capitalize: { textTransform: 'capitalize' },
});
