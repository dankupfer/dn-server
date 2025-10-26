// template/src/modules/feature/cards/styles.ts
import { StyleSheet } from 'react-native';
import { ProcessedTheme } from '@dankupfer/dn-components';

export const createCardsStyles = (theme: ProcessedTheme) =>
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

    // Cards section
    cardsSection: {
      paddingHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    sectionHeading: {
      color: theme.colors.text.default,
      fontSize: theme.typography.heading,
      fontWeight: '600',
      marginBottom: theme.spacing.md,
    },

    // Card container
    cardContainer: {
      marginBottom: theme.spacing.lg,
    },
    cardVisual: {
      backgroundColor: theme.colors.action.background,
      borderRadius: theme.borderRadius.button,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      minHeight: 120,
      justifyContent: 'space-between',
    },
    debitCard: {
      backgroundColor: theme.colors.brandAccent.background,
    },
    cardType: {
      color: theme.colors.action.text,
      fontSize: theme.typography.small,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    cardNumber: {
      color: theme.colors.action.text,
      fontSize: theme.typography.heading,
      fontWeight: '600',
      letterSpacing: 2,
      marginVertical: theme.spacing.sm,
    },
    cardName: {
      color: theme.colors.action.text,
      fontSize: theme.typography.small,
      fontWeight: '600',
      marginTop: 'auto',
    },
    cardExpiry: {
      color: theme.colors.action.text,
      fontSize: theme.typography.small,
      position: 'absolute',
      bottom: theme.spacing.lg,
      right: theme.spacing.lg,
    },

    // Card actions
    cardActions: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    actionButton: {
      backgroundColor: theme.colors.panel.background,
      borderColor: theme.colors.border.default,
      borderWidth: theme.borderWidth.button,
      borderRadius: theme.borderRadius.button,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      flex: 1,
    },
    actionButtonText: {
      color: theme.colors.text.default,
      fontSize: theme.typography.small,
      fontWeight: '600',
      textAlign: 'center',
    },

    // Services section
    servicesSection: {
      paddingHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    serviceItem: {
      backgroundColor: theme.colors.panel.background,
      borderRadius: theme.borderRadius.button,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: theme.borderWidth.button,
      borderColor: theme.colors.border.default,
    },
    serviceIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.action.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
    },
    serviceIconText: {
      fontSize: 20,
    },
    serviceContent: {
      flex: 1,
    },
    serviceTitle: {
      color: theme.colors.text.default,
      fontSize: theme.typography.body.fontSize,
      fontWeight: '600',
      marginBottom: theme.spacing.xs,
    },
    serviceDescription: {
      color: theme.colors.text.subdued,
      fontSize: theme.typography.small,
      lineHeight: 20,
    },
    serviceArrow: {
      color: theme.colors.action.background,
      fontSize: theme.typography.heading,
      marginLeft: theme.spacing.sm,
    },

    // Spacing
    bottomPadding: {
      height: theme.spacing.lg,
    },
  });