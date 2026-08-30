import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import { navigationRef } from './src/navigation/navigationRef';

// Create a small wrapper to handle dynamic status bar
const AppContent = () => {
  const { isDark } = useTheme();
  return (
    <NavigationContainer ref={navigationRef}>
      <AppNavigator />
      <StatusBar style={isDark ? "light" : "dark"} />
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.container}>
        <ThemeProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
