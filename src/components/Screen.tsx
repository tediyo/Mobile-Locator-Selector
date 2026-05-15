import { ScrollView, View, StyleSheet, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/src/context/ThemeContext';

export function Screen({
  scroll,
  children,
  style,
  ...props
}: ViewProps & { scroll?: boolean }) {
  const { colors } = useTheme();
  const content = scroll ? (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  ) : (
    <View style={styles.fill}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }, style]} {...props}>
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  fill: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 32, flexGrow: 1 },
});
