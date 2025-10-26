// template/src/modules/core/summary-router/styles.ts
import { StyleSheet } from 'react-native';
import { getToken, ProcessedTheme } from '@dankupfer/dn-tokens';

export const createSummaryRouterStyles = (theme: ProcessedTheme) =>
  StyleSheet.create({
    // =========================================================================
    // MAIN CONTAINER
    // =========================================================================
    container: {
      flex: 1,
      // backgroundColor: 'transparent',
      // backgroundColor: 'red',
      backgroundColor: theme.colors.page.background
      // backgroundColor: getValidColor(theme.tokens['background_page_default']),
    },

    // =========================================================================
    // SPLASH SCREEN
    // =========================================================================
    splashContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.page.background,
      padding: theme.spacing.lg,
    },
    splashTitle: {
      fontSize: theme.typography.heading,
      fontWeight: 'bold',
      color: theme.colors.text.default,
      marginBottom: theme.spacing.sm,
    },
    splashSubtitle: {
      fontSize: theme.typography.body.fontSize,
      color: theme.colors.text.subdued,
      marginBottom: theme.spacing.lg,
    },
    splashLoader: {
      marginTop: theme.spacing.lg,
    },

    // =========================================================================
    // AUTH SCREENS (LOGIN/REGISTER)
    // =========================================================================
    authContainer: {
      flex: 1,
      backgroundColor: theme.colors.page.background,
    },
    authContent: {
      flex: 1,
      justifyContent: 'center',
      padding: theme.spacing.lg,
    },
    authTitle: {
      fontSize: theme.typography.heading,
      fontWeight: 'bold',
      color: theme.colors.text.default,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    authSubtitle: {
      fontSize: theme.typography.body.fontSize,
      color: theme.colors.text.subdued,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
    },
    inputContainer: {
      marginBottom: theme.spacing.lg,
    },
    input: {
      backgroundColor: theme.colors.panel.background,
      borderWidth: theme.borderWidth.button,
      borderColor: theme.colors.border.default,
      borderRadius: theme.borderRadius.button,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      fontSize: theme.typography.body.fontSize,
      color: theme.colors.text.default,
      marginBottom: theme.spacing.md,
    },
    primaryButton: {
      backgroundColor: theme.colors.action.background,
      borderRadius: theme.borderRadius.button,
      paddingVertical: theme.spacing.md,
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    disabledButton: {
      backgroundColor: theme.colors.action.backgroundDisabled,
    },
    primaryButtonText: {
      color: theme.colors.action.text,
      fontSize: theme.typography.body.fontSize,
      fontWeight: '600',
    },
    secondaryButton: {
      alignItems: 'center',
    },
    secondaryButtonText: {
      color: theme.colors.text.subdued,
      fontSize: theme.typography.small,
    },

    // =========================================================================
    // DASHBOARD LAYOUT
    // =========================================================================
    dashboardContainer: {
      flex: 1,
      backgroundColor: theme.colors.page.background,
    },
    carouselContainer: {
      flex: 1,
    },

    // =========================================================================
    // OVERLAY MODAL
    // =========================================================================
    overlayContainer: {
      flex: 1,
      backgroundColor: theme.colors.page.background,
    },
    overlayContent: {
      flex: 1,
      padding: theme.spacing.md,
    },
    overlayCloseButton: {
      backgroundColor: theme.colors.action.background,
      borderRadius: theme.borderRadius.button,
      paddingVertical: theme.spacing.md,
      alignItems: 'center',
      marginTop: theme.spacing.lg,
      marginHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    overlayCloseText: {
      color: theme.colors.action.text,
      fontSize: theme.typography.body.fontSize,
      fontWeight: '600',
    },
  });