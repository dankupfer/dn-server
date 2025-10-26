// src/modules/feature/summary-wallet/components/WalletSummaryView.styles.ts
import { StyleSheet } from 'react-native';
import { ProcessedTheme } from '@dankupfer/dn-tokens';

export const createWalletSummaryViewStyles = (theme: ProcessedTheme, containerHeight: number) => {
  // Use the same tokens as ScreenBuilder
  const screenBackground = theme.tokens['background_page_default'] || '#ffffff';
  const textColor = theme.tokens['text_default'] || '#000000';
  const textSubduedColor = theme.tokens['text_subdued'] || '#666666';

  // Match ScreenBuilder's spacing tokens
  const contentPaddingHorizontal = 16;
  const contentPaddingVertical = 8;
  const sectionHeaderMarginTop = 8;
  const sectionHeaderMarginBottom = 8;
  const componentMarginBottom = 16;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: String(screenBackground),
    },

    // Add these new styles to your createWalletSummaryViewStyles:
    contentPadding: {
      paddingHorizontal: Number(theme.tokens['content_padding_horizontal']) || 16,
      paddingVertical: Number(theme.tokens['content_padding_vertical']) || 8,
    },
    componentWrapper: {
      marginBottom: Number(theme.tokens['component_margin_bottom']) || 16,
    },
    sectionHeader: {
      marginTop: Number(theme.tokens['section_header_margin_top']) || 8,
      marginBottom: Number(theme.tokens['section_header_margin_bottom']) || 8,
    },
    sectionTitle: {
      fontSize: Number(theme.tokens['section_header_font_size']) || 18,
      fontWeight: '600',
      color: String(theme.tokens['section_header_text_color']) || theme.colors.text.default,
    },

    // Menu button
    menuButton: {
      padding: 8,
    },

    // Stack container
    stackContainer: {
      position: 'relative',
      marginBottom: componentMarginBottom, // Match ScreenBuilder's component spacing
      overflow: 'hidden',
    },

    // Card styles (keep your existing card styling)
    card: {
      height: containerHeight,
      borderRadius: 16,
      padding: 16,
      justifyContent: 'space-between',
    },

    cardTopInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    accountInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },

    cardIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },

    accountDetails: {
      flex: 1,
    },

    accountName: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 2,
    },

    accountNumber: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: 12,
    },

    accountBalance: {
      color: '#ffffff',
      fontSize: 20,
      fontWeight: 'bold',
      marginLeft: 16,
    },

    negativeBalance: {
      color: '#ff6b6b',
    },

    cardBottomArea: {
      alignItems: 'flex-end',
    },

    cardButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.3)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },

    cardButtonText: {
      color: '#ffffff',
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },

    // Scroll container - match ScreenBuilder
    scrollContainer: {
      flex: 1,
      backgroundColor: String(screenBackground),
    },

    scrollContent: {
      flexGrow: 1,
    },

    tilesSection: {
      flex: 1,
    },

  });
};