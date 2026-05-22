import 'react-native-reanimated';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { navigationRef } from './src/navigation/navigationRef';
import { RootNavigator } from './src/navigation/RootNavigator';

function AppShell() {
  const { theme, colors } = useTheme();
  return (
    <>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <NavigationContainer ref={navigationRef}>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </NavigationContainer>
    </ThemeProvider>
  );
}
