import { ScrollView, StyleSheet, View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { spacing } from '../theme/tokens';
import { SystemShimmerBar } from './ui/Shimmer';

export function Screen({
  scroll,
  children,
  style,
  ambientShimmer = true,
  ...props
}: ViewProps & { scroll?: boolean; ambientShimmer?: boolean }) {
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
      {ambientShimmer ? <SystemShimmerBar /> : null}
      {content}
    </SafeAreaView>
  );
}

const TAB_BAR_HEIGHT = 92;

const styles = StyleSheet.create({
  safe: { flex: 1 },
  fill: { flex: 1, paddingBottom: TAB_BAR_HEIGHT },
  scroll: { padding: spacing.lg, paddingBottom: TAB_BAR_HEIGHT + spacing.lg, flexGrow: 1 },
});
