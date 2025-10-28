/**
 * FIGMA TEMPLATE
 * 
 * Complete banking/fintech app with advanced UI, theming, and all modules.
 * Template with complex navigation and features.
 * 
 * INCLUDED MODULES:
 * Core:
 * - splash: App startup experience
 * - authentication: Login/register system  
 * - assist-router: Advanced auth + dashboard with carousel
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
import { SafeAreaView, StyleSheet, StatusBar, Dimensions } from 'react-native';
import packageJson from './package.json';

// import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AssistRouter from './src/modules/core/figma-router';
import flagConfig from './src/modules/core/figma-router/flags.json';
import Settings from './src/modules/core/settings';

// Import ThemeProvider
import { CustomerProvider, FlagProvider, HeaderManager, ThemeProvider, useTheme } from '@dankupfer/dn-components';
import { HiddenDevMenu } from '@dankupfer/dn-components';

import { HeaderProvider } from '@dankupfer/dn-components';

export default function App() {
  const appVersion = packageJson.version;
  const appName = packageJson.name;

  console.log(`\n\n\n\n==================================\n\n${appName} started: version ${appVersion}\n\n==================================`);

  return (
    <FlagProvider>
      <ThemeProvider initialThemeMode="light" initialBrand="reimaginedLloyds">
        <CustomerProvider apiBaseUrl="http://localhost:3001">
          <AppWithTheme />
        </CustomerProvider>
      </ThemeProvider>
    </FlagProvider>
  );
}

// This component is now INSIDE the ThemeProvider, so it can use useTheme
const AppWithTheme = () => {
  const { theme, themeName, getToken } = useTheme();
  const screenWidth = Dimensions.get('window').width;

  return (
    <>
      <StatusBar
        barStyle={themeName === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={getToken('background_page_default')}
      />
      <HiddenDevMenu flagConfig={flagConfig} Settings={Settings} devSkipClicks={true} showDebugZones={true}>
        <HeaderProvider
          defaultTransition="crossFade"
          defaultHeader={{
            title: 'Loading...',
            showStatusBar: true,
          }}
        >
          {/* <SafeAreaView style={[styles.container, { backgroundColor: getToken('background_page_default') }]}> */}
          <SafeAreaView style={[styles.container, { backgroundColor: themeName === 'dark' ? 'black' : '#f1f1f1ff' }]}>
            <AssistRouter screenWidth={screenWidth} />
          </SafeAreaView>
        </HeaderProvider>
      </HiddenDevMenu>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    marginTop: 20,
  },
});