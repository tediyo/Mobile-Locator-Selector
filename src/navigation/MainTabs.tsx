import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { HistoryScreen } from '../screens/HistoryScreen';
import { LocatorScreen } from '../screens/LocatorScreen';
import { OverviewScreen } from '../screens/OverviewScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  const { token, isGuest } = useAuth();
  const { colors } = useTheme();
  const showAccountTabs = !!token && !isGuest;

  return (
    <Tab.Navigator
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
      <Tab.Screen
        name="Overview"
        component={OverviewScreen}
        options={{
          tabBarIcon: ({ color }) => <Icon name="bar-chart" size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="Locator"
        component={LocatorScreen}
        options={{
          tabBarIcon: ({ color }) => <Icon name="search" size={22} color={color} />,
        }}
      />
      {showAccountTabs && (
        <>
          <Tab.Screen
            name="History"
            component={HistoryScreen}
            options={{
              tabBarIcon: ({ color }) => <Icon name="history" size={22} color={color} />,
            }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              tabBarIcon: ({ color }) => <Icon name="user" size={22} color={color} />,
            }}
          />
        </>
      )}
    </Tab.Navigator>
  );
}
