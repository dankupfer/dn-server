// src/modules/core/main-navigator/index.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { moduleLoader } from '../../../config/moduleLoader';
import { ModuleState } from '../../../config/modules';

// Import the theme hook
import { useTheme } from '../../../theme/ThemeProvider';

// Types for different app states
type AppState = 'splash' | 'auth' | 'accountOverview';

const MainNavigator: React.FC = () => {
  // Get theme from context
  const { theme, isLoading } = useTheme();

  // Show loading state while theme is loading
  if (isLoading || !theme) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <Text style={{ color: 'white', fontSize: 16 }}>Loading theme...</Text>
      </View>
    );
  }

  // Track the current screen to display
  const [currentScreen, setCurrentScreen] = useState<AppState>('splash');
  // Track if modules are loaded
  const [modulesReady, setModulesReady] = useState(false);

  // Create dynamic styles based on theme
  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.lg,
    },
    loadingText: {
      fontSize: theme.fontSize.base,
      color: theme.colors.textSecondary,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.semantic.error,
      padding: theme.spacing.lg,
    },
    errorText: {
      color: theme.colors.neutral[50],
      fontSize: theme.fontSize.lg,
      fontWeight: '600',
    }
  });

  // ... rest of your existing useEffect code stays the same ...

  // Wait for modules to be loaded
  useEffect(() => {
    const checkModules = async () => {
      // Wait for module loader to be initialized
      await moduleLoader.initialize();

      // Check if required modules are loaded
      const requiredModules = ['splash', 'authentication', 'account-overview'];
      const allLoaded = requiredModules.every(moduleId =>
        moduleLoader.isModuleLoaded(moduleId)
      );

      if (allLoaded) {
        setModulesReady(true);
      } else {
        // If some modules aren't loaded, try again after a short delay
        setTimeout(checkModules, 500);
      }
    };

    checkModules();
  }, []);

  // Set up navigation flow
  useEffect(() => {
    // Only start navigation flow when modules are ready
    if (!modulesReady) return;

    // Simulate navigation flow - in a real app this would be based on authentication state

    // Example: After 3 seconds, move from splash to auth
    const splashTimer = setTimeout(() => {
      setCurrentScreen('auth');

      // Example: After 2 more seconds, move to account overview
      // In a real app, this would happen after successful authentication
      const authTimer = setTimeout(() => {
        setCurrentScreen('accountOverview');
      }, 2000);

      return () => clearTimeout(authTimer);
    }, 3000);

    return () => clearTimeout(splashTimer);
  }, [modulesReady]);

  // Get components from module loader
  const getScreenComponent = (moduleId: string) => {
    if (!modulesReady) return null;

    const module = moduleLoader.getModule(moduleId);
    if (module?.state === ModuleState.LOADED) {
      return module.component;
    }
    return null;
  };

  // Render the appropriate screen based on current state
  const renderScreen = () => {
    if (!modulesReady) {
      return (
        <View style={dynamicStyles.loadingContainer}>
          <Text style={dynamicStyles.loadingText}>Loading modules...</Text>
        </View>
      );
    }

    switch (currentScreen) {
      case 'splash': {
        const SplashComponent = getScreenComponent('splash');
        return SplashComponent ? <SplashComponent /> : (
          <Text style={dynamicStyles.errorText}>Splash module not loaded</Text>
        );
      }

      case 'auth': {
        const AuthComponent = getScreenComponent('authentication');
        return AuthComponent ? <AuthComponent /> : (
          <Text style={dynamicStyles.errorText}>Authentication module not loaded</Text>
        );
      }

      case 'accountOverview': {
        const AccountOverviewComponent = getScreenComponent('account-overview');
        return AccountOverviewComponent ? <AccountOverviewComponent /> : (
          <Text style={dynamicStyles.errorText}>Account Overview module not loaded</Text>
        );
      }

      default:
        return (
          <View style={dynamicStyles.errorContainer}>
            <Text style={dynamicStyles.errorText}>Unknown screen state</Text>
          </View>
        );
    }
  };

  return (
    <View style={dynamicStyles.container}>
      {renderScreen()}
    </View>
  );
};

// ... rest of your existing code (metadata, export) stays the same ...

// Module metadata
export const metadata = {
  version: '1.0.0',
  features: ['navigation', 'routing'],
  api: {
    // navigateTo: setCurrentScreen,
    // getCurrentScreen: () => currentScreen
  }
};

// Export default component
export default MainNavigator;