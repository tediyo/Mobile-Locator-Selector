import { Tabs } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';

export default function TabLayout() {
  const { token, isGuest } = useAuth();
  const { colors } = useTheme();
  const showAccountTabs = !!token && !isGuest;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.cardBg,
          borderTopColor: colors.cardBorder,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.tabInactive,
      }}
    >
      <Tabs.Screen
        name="overview"
        options={{
          title: 'Overview',
          tabBarIcon: ({ color }) => <FontAwesome name="bar-chart" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="locator"
        options={{
          title: 'Locator',
          tabBarIcon: ({ color }) => <FontAwesome name="search" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          href: showAccountTabs ? '/history' : null,
          tabBarIcon: ({ color }) => <FontAwesome name="history" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          href: showAccountTabs ? '/profile' : null,
          tabBarIcon: ({ color }) => <FontAwesome name="user" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
