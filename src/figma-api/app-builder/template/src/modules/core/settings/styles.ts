// src/modules/core/settings/styles.ts
import { StyleSheet } from 'react-native';
import { ProcessedTheme } from '@dankupfer/dn-tokens';

export const createSettingsStyles = (theme: ProcessedTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.page.background,
    },
    
    // Header
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderBottomWidth: theme.borderWidth.button,
      borderBottomColor: theme.colors.border.default,
    },
    headerTitle: {
      color: theme.colors.text.default,
      fontSize: theme.typography.heading,
      fontWeight: 'bold',
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.panel.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeButtonText: {
      color: theme.colors.text.default,
      fontSize: Number(theme.typography.body),
      fontWeight: 'bold',
    },
    
    // Content
    content: {
      flex: 1,
      padding: theme.spacing.md,
    },
    section: {
      marginBottom: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
      borderBottomWidth: theme.borderWidth.button,
      borderBottomColor: theme.colors.border.default,
    },
    sectionTitle: {
      color: theme.colors.text.default,
      fontSize: theme.typography.heading,
      fontWeight: '600',
      marginBottom: theme.spacing.sm,
    },
    
    // Settings Row
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.xs,
    },
    settingLabel: {
      color: theme.colors.text.default,
      fontSize: Number(theme.typography.body),
    },
    
    // Buttons
    dangerButton: {
      backgroundColor: '#ef4444', // Red color for danger action
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.button,
      alignItems: 'center',
      marginTop: theme.spacing.xs,
    },
    dangerButtonText: {
      color: '#ffffff',
      fontSize: Number(theme.typography.body),
      fontWeight: '600',
    },
    
    // Text styles
    infoText: {
      color: theme.colors.text.subdued,
      fontSize: theme.typography.small,
      lineHeight: 18,
      opacity: 0.8,
    },
    instructionText: {
      color: theme.colors.text.subdued,
      fontSize: theme.typography.small,
      lineHeight: 20,
      marginBottom: 4,
    },
    instructionNote: {
      color: theme.colors.text.subdued,
      fontSize: theme.typography.small,
      fontStyle: 'italic',
      marginTop: theme.spacing.xs,
      opacity: 0.7,
    },
  });