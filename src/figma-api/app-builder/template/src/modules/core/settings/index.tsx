// src/modules/core/settings/index.tsx
import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Text
} from 'react-native';
import { 
  ThemeSwitcher, 
  useTheme, 
  FlagManager, 
  FlagProvider,
  CustomerSelector,
  useCustomer  // Import useCustomer instead of CustomerProvider
} from '@dankupfer/dn-components';
import { createSettingsStyles } from './styles';

// Import flag configuration
import { FlagConfig } from '@dankupfer/dn-components';

interface SettingsProps {
  onClose?: () => void;
  showDebugInfo?: boolean;
  onToggleDebug?: (value: boolean) => void;
  flagConfig: FlagConfig;
}

const Settings: React.FC<SettingsProps> = ({
  onClose,
  showDebugInfo = false,
  onToggleDebug,
  flagConfig
}) => {
  const { theme } = useTheme();
  const styles = createSettingsStyles(theme);

  // Use the existing customer context instead of creating a new provider
  const { selectedCustomer } = useCustomer();

  const handleCustomerChange = (customer: any) => {
    // console.log('Selected customer:', customer);
    // This will now update the shared context that SummaryFromBuilder is also watching
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Developer Settings</Text>
        {onClose && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content}>
        {/* Debug Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Debug Options</Text>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Show Gesture Debug Info</Text>
            <Switch
              value={showDebugInfo}
              onValueChange={onToggleDebug}
              trackColor={{
                false: theme.colors.border.default,
                true: theme.colors.action.background
              }}
            />
          </View>
        </View>

        {/* Customer Profile - NOW USES EXISTING CONTEXT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Profile</Text>
          <CustomerSelector onCustomerChange={handleCustomerChange} />
          {selectedCustomer && (
            <Text style={styles.settingLabel}>
              Current: {selectedCustomer.name} ({selectedCustomer.email})
            </Text>
          )}
        </View>

        {/* Feature Flags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Feature Flags</Text>
          {/* <FlagProvider> */}
            <FlagManager config={flagConfig} />
          {/* </FlagProvider> */}
        </View>

        {/* Theme Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Theme Controls</Text>
          <ThemeSwitcher showCurrentInfo showBrandSelector={false} />
        </View>
      
      </ScrollView>
    </View>
  );
};

export default Settings;