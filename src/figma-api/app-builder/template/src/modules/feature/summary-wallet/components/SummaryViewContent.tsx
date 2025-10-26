// src/modules/feature/summary-wallet/components/SummaryViewContent.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useTheme, Tile } from '@dankupfer/dn-components';
import { createWalletSummaryViewStyles } from './WalletSummaryView.styles';

const CONTAINER_HEIGHT = 170;

interface SummaryViewContentProps {
    // Add any props you might need later
}

const SummaryViewContent: React.FC<SummaryViewContentProps> = () => {
    const { theme } = useTheme();
    const styles = createWalletSummaryViewStyles(theme, CONTAINER_HEIGHT);

    return (
        <View style={styles.contentPadding}>
            {/* Save & Invest Section */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                    Save & Invest
                </Text>
            </View>

            <View style={styles.componentWrapper}>
                <Tile
                    type="account"
                    data={{
                        id: 'fixed-rate-isa',
                        title: 'Fixed Rate ISA',
                        subtitle: '00-00-00 / 12345678',
                        accountNumber: '00-00-00 / 12345678',
                        balance: 1000.00,
                        variant: 'condensed',
                        onPress: () => {},
                    }}
                />
            </View>

            {/* Other ways we can help Section */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                    Other ways we can help
                </Text>
            </View>

            <View style={styles.componentWrapper}>
                <Tile
                    type="service"
                    data={{
                        id: 'borrow',
                        title: 'Borrow',
                        description: 'Check your credit score and see your borrowing options',
                        icon: {
                            color: '#22c55e',
                            name: 'icons|cards|debit_card',
                        },
                        showArrow: true,
                        onPress: () => {},
                    }}
                />
            </View>

            <View style={styles.componentWrapper}>
                <Tile
                    type="account"
                    data={{
                        id: 'fixed-rate-isa-2',
                        title: 'Fixed Rate ISA',
                        subtitle: '00-00-00 / 12345678',
                        accountNumber: '00-00-00 / 12345678',
                        balance: 1000.00,
                        variant: 'detailed',
                        onPress: () => {},
                    }}
                />
            </View>

            <View style={styles.componentWrapper}>
                <Tile
                    type="service"
                    data={{
                        id: 'homes',
                        title: 'Homes',
                        description: 'Find your perfect home with our mortgage tools',
                        icon: {
                            color: '#a855f7',
                            name: 'icons|cards|debit_card',
                        },
                        showArrow: true,
                        onPress: () => {},
                    }}
                />
            </View>
            <View style={styles.componentWrapper}>
                <Tile
                    type="service"
                    data={{
                        id: 'homes',
                        title: 'Homes',
                        description: 'Find your perfect home with our mortgage tools',
                        icon: {
                            color: '#a855f7',
                            name: 'icons|cards|debit_card',
                        },
                        showArrow: true,
                        onPress: () => {},
                    }}
                />
            </View>
            <View style={styles.componentWrapper}>
                <Tile
                    type="service"
                    data={{
                        id: 'homes',
                        title: 'Homes',
                        description: 'Find your perfect home with our mortgage tools',
                        icon: {
                            color: '#a855f7',
                            name: 'icons|cards|debit_card',
                        },
                        showArrow: true,
                        onPress: () => {},
                    }}
                />
            </View>
            <View style={styles.componentWrapper}>
                <Tile
                    type="service"
                    data={{
                        id: 'homes',
                        title: 'Homes',
                        description: 'Find your perfect home with our mortgage tools',
                        icon: {
                            color: '#a855f7',
                            name: 'icons|cards|debit_card',
                        },
                        showArrow: true,
                        onPress: () => {},
                    }}
                />
            </View>
            <View style={styles.componentWrapper}>
                <Tile
                    type="service"
                    data={{
                        id: 'homes',
                        title: 'Homes',
                        description: 'Find your perfect home with our mortgage tools',
                        icon: {
                            color: '#a855f7',
                            name: 'icons|cards|debit_card',
                        },
                        showArrow: true,
                        onPress: () => {},
                    }}
                />
            </View>

            {/* Add more tiles with proper wrapper structure */}
            {/* ... rest of your tiles with the same pattern */}
        </View>
    );
};

export default SummaryViewContent;