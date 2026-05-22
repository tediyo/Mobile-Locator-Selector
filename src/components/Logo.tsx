import { Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

/** Text logo matching web TWT branding when image assets are unavailable */
export function Logo({ size = 'lg' }: { size?: 'sm' | 'lg' }) {
  const { colors } = useTheme();
  return (
    <Text style={[styles.logo, size === 'lg' ? styles.lg : styles.sm, { color: colors.accent }]}>
      TWT
    </Text>
  );
}

const styles = StyleSheet.create({
  logo: { fontWeight: '800', letterSpacing: 2 },
  lg: { fontSize: 36 },
  sm: { fontSize: 24 },
});
