/**
 * FULL FEATURED TEMPLATE
 * 
 * Complete banking/fintech app with advanced UI, theming, and all modules.
 * Template with complex navigation and features.
 * 
 * INCLUDED MODULES:
 * Core:
 * - splash: App startup experience
 * - authentication: Login/register system  
 * - combined-auth: Advanced auth + dashboard with carousel
 * 
 * Features:
 * - summary: Account overview and balance
 * - everyday: Daily banking operations
 * - cards: Card management system
 * - apply: Product application flow
 * 
 * FEATURES:
 * - Dynamic theming system (light/dark + brands)
 * - Horizontal carousel navigation with pill masking
 * - Bottom tab navigation with overlays
 * - Cross-platform support (iOS/Android/Web)
 * - Advanced UI components and animations
 * 
 * DEPENDENCIES:
 * - react-native-gesture-handler
 * - ThemeProvider system
 * - All feature modules
 * 
 * USE CASE: Complex apps, fintech, production applications
 */

import React from 'react';
import { SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import packageJson from './package.json';

// import { GestureHandlerRootView } from 'react-native-gesture-handler';
import CombinedAuthModule from './src/modules/core/combined-auth';
import flagConfig from './src/modules/core/combined-auth/flags.json';
import Settings from './src/modules/core/settings';

// Import ThemeProvider
import { FlagProvider, ThemeProvider, useTheme } from '@dankupfer/dn-components';
import { HiddenDevMenu } from '@dankupfer/dn-components';

export default function App() {
  const appVersion = packageJson.version;
  const appName = packageJson.name;

  console.log(`\n\n\n\n==================================\n\n${appName} started: version ${appVersion}\n\n==================================`);

  return (
    <FlagProvider>
      <ThemeProvider initialThemeMode="light" initialBrand="reimaginedLloyds">
        <AppWithTheme />
      </ThemeProvider>
    </FlagProvider>
  );
}

// This component is now INSIDE the ThemeProvider, so it can use useTheme
const AppWithTheme = () => {
  const { theme, themeName } = useTheme();

  return (
    <>
      <StatusBar
        barStyle={themeName === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={themeName === 'dark' ? '#1a1a1a' : theme.colors.page.background}
      />
      <HiddenDevMenu flagConfig={flagConfig} Settings={Settings} devSkipClicks={false} showDebugZones={true}>
        {/* <GestureHandlerRootView style={styles.container}> */}
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.page.background }]}>
          <CombinedAuthModule />
        </SafeAreaView>
        {/* </GestureHandlerRootView> */}
      </HiddenDevMenu>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});