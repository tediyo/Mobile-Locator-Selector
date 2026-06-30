import { StyleSheet, View, type ViewProps } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { radius, shadow, spacing } from '../../theme/tokens';

export function Card({ style, children, ...props }: ViewProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        shadow('sm', colors.shadow),
        { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
});
