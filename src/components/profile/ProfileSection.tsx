import { View, Text, StyleSheet, type ViewProps } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export function ProfileSection({
  title,
  subtitle,
  children,
  style,
  ...props
}: ViewProps & { title: string; subtitle?: string }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.wrap, style]} {...props}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text> : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 20, gap: 10 },
  header: { gap: 2, paddingHorizontal: 2 },
  title: { fontSize: 13, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  subtitle: { fontSize: 12 },
});
