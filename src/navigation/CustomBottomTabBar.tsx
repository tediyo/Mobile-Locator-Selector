import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useTheme } from '../context/ThemeContext';
import { shadow } from '../theme/tokens';

const TAB_ICONS: Record<string, string> = {
  Overview: 'bar-chart',
  Locator: 'search',
  Performance: 'tachometer',
  History: 'history',
};

const PROFILE_ROUTE = 'Profile';

export function CustomBottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const pillRoutes = state.routes.filter((r) => r.name !== PROFILE_ROUTE);
  const profileRoute = state.routes.find((r) => r.name === PROFILE_ROUTE);
  const profileIndex = profileRoute
    ? state.routes.findIndex((r) => r.key === profileRoute.key)
    : -1;
  const isProfileActive = profileIndex !== -1 && state.index === profileIndex;

  const onProfilePress = () => {
    if (!profileRoute) return;
    const event = navigation.emit({
      type: 'tabPress',
      target: profileRoute.key,
      canPreventDefault: true,
    });
    if (!event.defaultPrevented) {
      navigation.navigate(PROFILE_ROUTE);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View
        style={[
          styles.pill,
          { backgroundColor: colors.cardBg },
          shadow('lg', colors.shadow ?? '#0f172a'),
        ]}
      >
        {pillRoutes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const label = options.tabBarLabel !== undefined
            ? (options.tabBarLabel as string)
            : options.title !== undefined
              ? options.title
              : route.name;
          const iconName = TAB_ICONS[route.name] ?? 'circle';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tab}
            >
              <Icon
                name={iconName}
                size={22}
                color={isFocused ? colors.accent : colors.tabInactive}
              />
              <Text
                style={[
                  styles.label,
                  { color: isFocused ? colors.accent : colors.tabInactive },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {profileRoute ? (
        <Pressable
          onPress={onProfilePress}
          style={[
            styles.profile,
            { backgroundColor: isProfileActive ? colors.accent : colors.cardBg },
            shadow('lg', colors.shadow ?? '#0f172a'),
          ]}
        >
          <Icon
            name="user"
            size={22}
            color={isProfileActive ? '#ffffff' : colors.tabInactive}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    height: 64,
    borderRadius: 32,
    paddingHorizontal: 8,
    flex: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
  },
  profile: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
});
