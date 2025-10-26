// src/modules/feature/summary-from-builder/index.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SummaryBuilder, useCustomer, useTheme } from '@dankupfer/dn-components';
import { useFlags } from '@dankupfer/dn-components';

export interface SummaryFromBuilderProps {
    screenWidth: number;
    onAccountPress?: (account: any) => void;
    onQuickActionPress?: (actionId: string) => void;
}

/**
 * SummaryFromBuilder Feature Component
 * 
 * A feature module that uses the SummaryBuilder component to create
 * personalized banking summaries from customer context data.
 * 
 * This component:
 * - Consumes customer data from CustomerContext
 * - Passes the data to SummaryBuilder for transformation
 * - Handles loading and error states
 * - Provides callbacks for user interactions
 * 
 * @example
 * ```tsx
 * <SummaryFromBuilder 
 *   screenWidth={screenWidth}
 *   onAccountPress={(account) => navigation.navigate('AccountDetails', { account })}
 *   onQuickActionPress={(actionId) => handleQuickAction(actionId)}
 * />
 * ```
 */
const SummaryFromBuilder: React.FC<SummaryFromBuilderProps> = ({
    screenWidth,
    onAccountPress,
    onQuickActionPress
}) => {
    // Get customer data from context
    const {
        selectedCustomerData,
        selectedCustomer,
        isLoading,
        error,
        isLoadingCustomerData,
        customerDataError,
        loadFullCustomerData
    } = useCustomer();

    // const { flags } = useFlags();
    // const { theme } = useTheme();

    // useEffect(() => {
    //     console.log('🔄 Flags changed:', flags);
    // }, [flags]);

    // useEffect(() => {
    //     console.log('🎨 Theme changed');
    // }, [theme]);

    // useEffect(() => {
    //     console.log('👤 Customer data changed');
    // }, [selectedCustomerData]);

    // Load customer data on mount if we have a selected customer but no data
    useEffect(() => {
        if (selectedCustomer?.id && !selectedCustomerData && !isLoadingCustomerData) {
            loadFullCustomerData(selectedCustomer.id);
        }
    }, [selectedCustomer?.id, selectedCustomerData?.customerId, isLoadingCustomerData, loadFullCustomerData]);

    // Handle loading state
    if (isLoading || isLoadingCustomerData) {
        return (
            <View style={[styles.centeredContainer, { width: screenWidth }]}>
                <Text style={styles.text}>Loading your summary...</Text>
            </View>
        );
    }

    // Handle error state
    if (error || customerDataError) {
        return (
            <View style={[styles.centeredContainer, { width: screenWidth }]}>
                <Text style={styles.errorText}>Unable to load summary</Text>
                <Text style={styles.text}>{error || customerDataError}</Text>
            </View>
        );
    }

    // Handle no customer selected
    if (!selectedCustomerData) {
        return (
            <View style={[styles.centeredContainer, { width: screenWidth }]}>
                <Text style={styles.text}>No customer selected</Text>
                <Text style={styles.text}>
                    Please select a customer to view their banking summary.
                </Text>
            </View>
        );
    }

    // Render SummaryBuilder with customer data
    return (
        <SummaryBuilder
            customerData={selectedCustomerData}
            screenWidth={screenWidth}
            config={{
                showGreeting: true,
                showTotalBalance: true,
                showQuickActions: true,
                useCondensedAccounts: true,
                maxAccounts: undefined // Show all accounts
            }}
            onAccountPress={onAccountPress}
            onQuickActionPress={onQuickActionPress}
            testID="summary-from-builder"
        />
    );
};

export default SummaryFromBuilder;

const styles = StyleSheet.create({
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#ffffff',
    },
    text: {
        fontSize: 16,
        color: '#666666',
        textAlign: 'center',
        marginBottom: 8,
    },
    errorText: {
        fontSize: 16,
        color: '#ef4444',
        textAlign: 'center',
        marginBottom: 8,
    },
});