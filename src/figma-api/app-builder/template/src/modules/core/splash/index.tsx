// src/modules/core/splash/index.tsx
import React, { useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator
} from 'react-native';
import { useTheme } from '@dankupfer/dn-components';
import { createCombinedAuthStyles } from '../combined-auth/styles';

interface SplashProps {
  onSplashComplete: () => void;
  timeout?: number;
}

const Splash: React.FC<SplashProps> = ({ 
  onSplashComplete, 
  timeout = 2000 
}) => {
  const { theme } = useTheme();
  const styles = createCombinedAuthStyles(theme);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSplashComplete();
    }, timeout);

    return () => clearTimeout(timer);
  }, [onSplashComplete, timeout]);

  return (
    <View style={styles.splashContainer}>
      <Text style={styles.splashTitle}>BankApp</Text>
      <Text style={styles.splashSubtitle}>Your Financial Partner</Text>
      <ActivityIndicator 
        size="large" 
        color={theme.colors.action.background} 
        style={styles.splashLoader} 
      />
    </View>
  );
};

export default Splash;