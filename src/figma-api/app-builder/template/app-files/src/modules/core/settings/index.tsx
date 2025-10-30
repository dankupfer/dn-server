// src/modules/core/settings/index.tsx
import React from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text
} from 'react-native';
import {
  ThemeSwitcher,
  useTheme,
  CustomerSelector,
  useCustomer,
  SettingsManager
} from '@dankupfer/dn-components';
import { createSettingsStyles } from './styles';
import { settingsConfig } from '../figma-router/settings';

// Import flag configuration type
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
        {/* SettingsManager - replaces manual debug options and includes FlagManager */}
        {/* <View style={styles.section}> */}
          <SettingsManager
            config={settingsConfig}
            currentContext="all"
            flagConfig={flagConfig}
          />
        {/* </View> */}

        {/* Customer Profile - uses existing context */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Profile</Text>
          <CustomerSelector onCustomerChange={handleCustomerChange} />
          {selectedCustomer && (
            <Text style={styles.settingLabel}>
              Current: {selectedCustomer.name} ({selectedCustomer.email})
            </Text>
          )}
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