import { Image, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export function Logo({ size = 'lg' }: { size?: 'sm' | 'lg' }) {
  const { theme } = useTheme();
  const source = theme === 'dark'
    ? require('../../assets/Logo/black.png')
    : require('../../assets/Logo/white.png');
  const dimensions = size === 'lg' ? { width: 120, height: 40 } : { width: 72, height: 24 };
  return (
    <Image
      source={source}
      style={[styles.logo, dimensions]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  logo: { alignSelf: 'flex-start' },
});
