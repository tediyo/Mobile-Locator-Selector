import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { HistoryScreen } from '../screens/HistoryScreen';
import { LocatorScreen } from '../screens/LocatorScreen';
import { OverviewScreen } from '../screens/OverviewScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { CustomBottomTabBar } from './CustomBottomTabBar';
import { PerformanceStack } from './PerformanceStack';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  const { token, isGuest } = useAuth();
  const showAccountTabs = !!token && !isGuest;

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomBottomTabBar {...props} />}
      screenOptions={{
        lazy: true,
        freezeOnBlur: true,
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tab.Screen name="Overview" component={OverviewScreen} />
      <Tab.Screen name="Locator" component={LocatorScreen} />
      <Tab.Screen
        name="Performance"
        component={PerformanceStack}
        options={{ tabBarLabel: 'Perf' }}
      />
      {showAccountTabs && (
        <>
          <Tab.Screen name="History" component={HistoryScreen} />
          <Tab.Screen name="Profile" component={ProfileScreen} />
        </>
      )}
    </Tab.Navigator>
  );
}
