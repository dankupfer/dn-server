// src/modules/feature/summary-wallet/components/CardStack.tsx
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme, Icon } from '@dankupfer/dn-components';
import { AccountData } from '../index';
import { createWalletSummaryViewStyles } from './WalletSummaryView.styles';
import Animated, {
    useAnimatedStyle,
    interpolate,
    SharedValue
} from 'react-native-reanimated';

interface CardStackProps {
    accounts: AccountData[];
    onCardPress: (account: AccountData) => void;
    transitionProgress: SharedValue<number>;
    selectedAccountId: string | null;
}

const CONTAINER_HEIGHT = 170;

const CardStack: React.FC<CardStackProps> = ({
    accounts,
    onCardPress,
    transitionProgress,
    selectedAccountId
}) => {
    const { theme } = useTheme();
    const styles = createWalletSummaryViewStyles(theme, CONTAINER_HEIGHT);

    const renderStackedCard = (account: AccountData, index: number, totalCards: number) => {
        const isTopCard = index === accounts.length - 1;
        const isSelected = account.id === selectedAccountId;

        // Simple stacking with downward offset
        const stackPosition = index * (CONTAINER_HEIGHT / totalCards);

        // Create individual card animation style
        const cardAnimatedStyle = useAnimatedStyle(() => {
            if (isSelected) {
                // Selected card: move to detail position (top of wrapper)
                return {
                    transform: [
                        {
                            translateY: interpolate(
                                transitionProgress.value,
                                [0, 1],
                                [stackPosition, 0] // Move from stack position to top
                            )
                        }
                    ]
                };
            } else {
                // Non-selected cards: move down within wrapper bounds
                return {
                    transform: [
                        {
                            translateY: interpolate(
                                transitionProgress.value,
                                [0, 1],
                                [stackPosition, CONTAINER_HEIGHT] // Move down within wrapper bounds
                            )
                        }
                    ]
                };
            }
        });

        return (
            <Animated.View
                key={account.id}
                style={[
                    {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: index + 1,
                    },
                    cardAnimatedStyle
                ]}
            >
                <TouchableOpacity
                    onPress={() => onCardPress(account)}
                    activeOpacity={0.9}
                >
                    <View style={[
                        styles.card,
                        {
                            backgroundColor: account.color,
                            shadowColor: '#000000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                            elevation: 3,
                        }
                    ]}>
                        {/* Card content */}
                        <View style={styles.cardTopInfo}>
                            <View style={styles.accountInfo}>
                                <View style={styles.cardIcon}>
                                    <Icon name="icons|cards|debit_card" size={20} color="#ffffff" />
                                </View>
                                <View style={styles.accountDetails}>
                                    <Text style={styles.accountName}>
                                        {account.name}
                                    </Text>
                                    <Text style={styles.accountNumber}>
                                        {account.accountNumber}
                                    </Text>
                                </View>
                            </View>

                            <Text style={[
                                styles.accountBalance,
                                account.balance < 0 && styles.negativeBalance
                            ]}>
                                £{Math.abs(account.balance).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </Text>
                        </View>

                        {/* {isTopCard && ( */}
                        <View style={styles.cardBottomArea}>
                            <TouchableOpacity style={styles.cardButton}>
                                <Icon name="icons|cards|debit_card" size={16} color="#ffffff" />
                                <Text style={styles.cardButtonText}>Cardy</Text>
                            </TouchableOpacity>
                        </View>
                        {/* )} */}
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <View style={[styles.stackContainer, { height: CONTAINER_HEIGHT }]}>
            {accounts.map((account, index) => renderStackedCard(account, index, accounts.length))}
        </View>
    );
};

export default CardStack;