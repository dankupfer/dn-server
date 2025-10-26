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
 * - Customer data context for personalized banking summaries
 * 
 * DEPENDENCIES:
 * - react-native-gesture-handler
 * - ThemeProvider system
 * - CustomerProvider for customer data management
 * - All feature modules
 * 
 * USE CASE: Complex apps, fintech, production applications
 */

import React from 'react';
import { SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import packageJson from './package.json';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppRouter from './src/modules/core/summary-router/components/AppRouter';
import flagConfig from './src/modules/core/summary-router/flags.json';
import Settings from './src/modules/core/settings';

// Import ThemeProvider and other components
import { FlagProvider, ThemeProvider, useTheme } from '@dankupfer/dn-components';
import { HiddenDevMenu } from '@dankupfer/dn-components';

// Import CustomerProvider
import { CustomerProvider } from '@dankupfer/dn-components';


export default function App() {
  const appVersion = packageJson.version;
  const appName = packageJson.name;

  console.log(`\n\n\n\n==================================\n\n${appName} started: version ${appVersion}\n\n==================================`);

  return (
    <FlagProvider>
      <ThemeProvider initialThemeMode="light" initialBrand="reimaginedLloyds">
        {/* <CustomerProvider apiBaseUrl="http://localhost:3001"> */}
        <CustomerProvider apiBaseUrl="https://dn-server-974885144591.us-central1.run.app">
          <AppWithTheme />
        </CustomerProvider>
      </ThemeProvider>
    </FlagProvider>
  );
}

// This component is now INSIDE the ThemeProvider and CustomerProvider, so it can use both contexts
const AppWithTheme = () => {
  const { theme, themeName } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: String(`#${theme.colors.page.background}`),
      // backgroundColor: 'red',
      // backgroundColor: '#f5f5f5',
    },
  });

  return (
    <>
      <StatusBar
        barStyle={themeName === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={themeName === 'dark' ? '#1a1a1a' : theme.colors.page.background}
      />
      <HiddenDevMenu flagConfig={flagConfig} Settings={Settings} devSkipClicks={true} showDebugZones={true}>
        <GestureHandlerRootView style={styles.container}>
          <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.page.background }]}>
            {/* Test AppRouter directly - now has access to CustomerProvider context */}
            <AppRouter />
          </SafeAreaView>
        </GestureHandlerRootView>
      </HiddenDevMenu>
    </>
  );
};