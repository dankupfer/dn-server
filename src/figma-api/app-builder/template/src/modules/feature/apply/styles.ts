// template/src/modules/feature/apply/styles.ts
import { StyleSheet } from 'react-native';
import { ProcessedTheme } from '@dankupfer/dn-components';

export const createApplyStyles = (theme: ProcessedTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.page.background,
    },

    // Header styles (matching main app)
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.md,
      paddingTop: theme.spacing.sm,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    notificationBadge: {
      backgroundColor: theme.colors.action.background,
      borderRadius: theme.borderRadius.button,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 2,
      marginRight: theme.spacing.md,
    },
    notificationCount: {
      color: theme.colors.action.text,
      fontSize: theme.typography.small,
      fontWeight: 'bold',
    },
    sectionTitle: {
      color: theme.colors.text.default,
      fontSize: theme.typography.heading,
      fontWeight: '600',
    },
    logoutButton: {
      backgroundColor: theme.colors.panel.background,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.button,
    },
    logoutText: {
      color: theme.colors.text.default,
      fontSize: theme.typography.small,
    },

    // Content styles
    content: {
      flex: 1,
    },
    welcomeSection: {
      padding: theme.spacing.lg,
      alignItems: 'center',
    },
    welcomeTitle: {
      color: theme.colors.text.default,
      fontSize: theme.typography.heading,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    welcomeSubtitle: {
      color: theme.colors.text.subdued,
      fontSize: theme.typography.body.fontSize,
      textAlign: 'center',
      lineHeight: 24,
    },

    // Categories styles
    categoriesSection: {
      paddingHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    sectionHeading: {
      color: theme.colors.text.default,
      fontSize: theme.typography.heading,
      fontWeight: '600',
      marginBottom: theme.spacing.md,
    },

    // Application card styles
    applicationCard: {
      backgroundColor: theme.colors.panel.background,
      borderRadius: theme.borderRadius.button,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: theme.borderWidth.button,
      borderColor: theme.colors.border.default,
    },
    cardIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.action.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
    },
    cardIconText: {
      fontSize: 20,
    },
    cardContent: {
      flex: 1,
    },
    cardTitle: {
      color: theme.colors.text.default,
      fontSize: theme.typography.body.fontSize,
      fontWeight: '600',
      marginBottom: theme.spacing.xs,
    },
    cardDescription: {
      color: theme.colors.text.subdued,
      fontSize: theme.typography.small,
      lineHeight: 20,
    },
    cardArrow: {
      color: theme.colors.action.background,
      fontSize: theme.typography.heading,
      marginLeft: theme.spacing.sm,
    },

    // Spacing
    bottomPadding: {
      height: theme.spacing.lg,
    },
  });