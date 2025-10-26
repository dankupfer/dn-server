// App.tsx
import { SafeAreaView, ScrollView, Text } from "react-native";
import { Tile } from "@dankupfer/dn-components";
import CardStack from './components/CardStack';
import React, { useState, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, useHeader } from '@dankupfer/dn-components';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS
} from 'react-native-reanimated';

// Mock data
import mockData from './mockData.json';
// import { AccountData } from './types'; // optional type import if needed


export interface AccountData {
    id: string;
    name: string;
    accountNumber: string;
    balance: number;
    type: 'current' | 'savings' | 'credit';
    color: string;
    icon: string;
}

interface SummaryWalletProps {
    screenWidth: number;
    onTabVisibilityChange?: (shouldHide: boolean) => void;
    transitionSpeed?: number;
    onScroll?: () => void;
    onScrollEnd?: () => void;
    onScrollBeginDrag?: () => void;
    onScrollEndDrag?: () => void;
}

const TRANSITION_SPEED = 300;

const App: React.FC<SummaryWalletProps> = ({
    screenWidth,
    onTabVisibilityChange,
    transitionSpeed = TRANSITION_SPEED,
    onScroll,
    onScrollEnd,
    onScrollBeginDrag,
    onScrollEndDrag
}) => {
    const { theme } = useTheme();
    const { push, pop } = useHeader();

    const [walletState, setWalletState] = useState<'stack' | 'detail' | 'transitioning'>('stack');
    const [selectedAccount, setSelectedAccount] = useState<AccountData | null>(null);
    const [showDetail, setShowDetail] = useState(false);

    const transitionProgress = useSharedValue(0);
    const scrollViewRef = useRef<ScrollView>(null);

    const accounts: AccountData[] = mockData.accounts.map((account) => ({
        ...account,
        type: account.type as 'current' | 'savings' | 'credit',
    }));

    const onTransitionComplete = (toDetail: boolean) => {
        // if (toDetail) {
        //     setWalletState('detail');
        // } else {
        //     setWalletState('stack');
        //     setSelectedAccount(null);
        // }
    };

    const handleCardPress = (account: AccountData) => {
        runOnJS(setShowDetail)(true);
        setSelectedAccount(account);
        setWalletState('detail');
        setWalletState('transitioning');
        onTabVisibilityChange?.(true);

        transitionProgress.value = withTiming(1, { duration: transitionSpeed }, (finished) => {
            if (finished) {
                // runOnJS(setShowDetail)(true);
                runOnJS(onTransitionComplete)(true);
            }
        });

        scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });

        push({
            id: `account-${account.id}`,
            title: account.name,
            variant: 'modal',
            leftAction: { type: 'back', onPress: handleBackPress, accessibilityLabel: 'Go back to accounts' },
            rightActions: [
                { type: 'custom', iconName: 'icons|miscellaneous|settings', onPress: () => console.log('Account settings pressed'), accessibilityLabel: 'Account settings' }
            ]
        });
    };

    const handleBackPress = () => {
        runOnJS(setShowDetail)(false);
        setWalletState('transitioning');
        onTabVisibilityChange?.(false);

        transitionProgress.value = withTiming(0, { duration: transitionSpeed }, (finished) => {
            if (finished) {
                runOnJS(onTransitionComplete)(false);
            }
        });

        scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
        pop();
    };

    // Animated styles
    const summaryStyle = useAnimatedStyle(() => ({
        opacity: withTiming(showDetail ? 0 : 1, { duration: transitionSpeed }),
    }));

    const detailStyle = useAnimatedStyle(() => ({
        opacity: withTiming(showDetail ? 1 : 0, { duration: transitionSpeed }),
    }));
    const styles = StyleSheet.create({
        container: {
            flex: 1,
            // backgroundColor: '#ccc'
            backgroundColor: String(`#${theme.colors.page.background}`)
        },
        scroll: { padding: 16, gap: 16 },

    });

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={styles.scroll}
                onScroll={onScroll}
                onScrollBeginDrag={onScrollBeginDrag}
                onScrollEndDrag={onScrollEndDrag}
            >

                {/* Card Stack */}
                <CardStack
                    accounts={accounts}
                    onCardPress={handleCardPress}
                    transitionProgress={transitionProgress}
                    selectedAccountId={selectedAccount?.id || null}
                />

                {/* Summary / Detail Views */}
                <Animated.View style={summaryStyle}>
                    {!showDetail && <SummaryViewContent2 />}
                </Animated.View>

                <Animated.View style={detailStyle}>
                    {showDetail && <SummaryViewContent3 />}
                </Animated.View>

            </ScrollView>
        </SafeAreaView>
    );
};

export const MySectionHeader = () => {
    const { theme } = useTheme();

    const styles = StyleSheet.create({
        sectionHeader: {
            paddingVertical: 12,
            paddingHorizontal: 16,
            backgroundColor: String(`#${theme.colors.page.background}`),
        },
        sectionHeaderText: {
            fontSize: theme.typography.body.fontSize,
            color: String(`#${theme.tokens.text_brand}`),
            fontFamily: theme.typography.body.fontFamily
        },
    });

    return (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>Section Header</Text>
        </View>
    );
};



// -----------------------------
// Content Components
// -----------------------------
const SummaryViewContent2 = () => (
    <View>
        <MySectionHeader />

        <Tile type="account" data={{ id: "club-lloyds", title: "Club Lloyds", subtitle: "12-34-56 / 12345678", accountNumber: "12-34-56 / 12345678", balance: 935.68, variant: "condensed", onPress: () => console.log("Account pressed") }} />
        <Tile type="service" data={{ id: "everyday-offers", title: "Everyday Offers", description: "Save money on your everyday spending", icon: { name: "icons|miscellaneous|calculator", color: "#22c55e" }, badge: { text: "NEW", color: "#ef4444" }, showArrow: true, onPress: () => console.log("Service pressed") }} />
        <Tile type="creditCard" data={{ id: "cashback-card", title: "Cashback Credit Card", subtitle: "****9053", cardNumber: "****9053", balance: 1234.56, balanceLabel: "Balance after pending", availableCredit: 2765.44, onPress: () => console.log("Credit card pressed") }} />
        <Tile type="creditCard" data={{ id: "cashback-card", title: "Cashback Credit Card", subtitle: "****9053", cardNumber: "****9053", balance: 1234.56, balanceLabel: "Balance after pending", availableCredit: 2765.44, onPress: () => console.log("Credit card pressed") }} />
        <Tile type="creditCard" data={{ id: "cashback-card", title: "Cashback Credit Card", subtitle: "****9053", cardNumber: "****9053", balance: 1234.56, balanceLabel: "Balance after pending", availableCredit: 2765.44, onPress: () => console.log("Credit card pressed") }} />
        <Tile type="creditCard" data={{ id: "cashback-card", title: "Cashback Credit Card", subtitle: "****9053", cardNumber: "****9053", balance: 1234.56, balanceLabel: "Balance after pending", availableCredit: 2765.44, onPress: () => console.log("Credit card pressed") }} />
        <Tile type="creditCard" data={{ id: "cashback-card", title: "Cashback Credit Card", subtitle: "****9053", cardNumber: "****9053", balance: 1234.56, balanceLabel: "Balance after pending", availableCredit: 2765.44, onPress: () => console.log("Credit card pressed") }} />
        {/* Add more tiles as needed */}
    </View>
);

const SummaryViewContent3 = () => (
    <View>
        <Tile type="account" data={{ id: "club-lloyds", title: "This is a different Screen", subtitle: "12-34-56 / 12345678", accountNumber: "12-34-56 / 12345678", balance: 935.68, variant: "condensed", onPress: () => console.log("Account pressed") }} />
        <Tile type="service" data={{ id: "everyday-offers", title: "Everyday Offers", description: "Save money on your everyday spending", icon: { name: "icons|miscellaneous|calculator", color: "#22c55e" }, badge: { text: "NEW", color: "#ef4444" }, showArrow: true, onPress: () => console.log("Service pressed") }} />
        <Tile type="creditCard" data={{ id: "cashback-card", title: "Cashback Credit Card", subtitle: "****9053", cardNumber: "****9053", balance: 1234.56, balanceLabel: "Balance after pending", availableCredit: 2765.44, onPress: () => console.log("Credit card pressed") }} />
        <Tile type="creditCard" data={{ id: "cashback-card", title: "Cashback Credit Card", subtitle: "****9053", cardNumber: "****9053", balance: 1234.56, balanceLabel: "Balance after pending", availableCredit: 2765.44, onPress: () => console.log("Credit card pressed") }} />
        <Tile type="creditCard" data={{ id: "cashback-card", title: "Cashback Credit Card", subtitle: "****9053", cardNumber: "****9053", balance: 1234.56, balanceLabel: "Balance after pending", availableCredit: 2765.44, onPress: () => console.log("Credit card pressed") }} />
        <Tile type="creditCard" data={{ id: "cashback-card", title: "Cashback Credit Card", subtitle: "****9053", cardNumber: "****9053", balance: 1234.56, balanceLabel: "Balance after pending", availableCredit: 2765.44, onPress: () => console.log("Credit card pressed") }} />
        <Tile type="creditCard" data={{ id: "cashback-card", title: "Cashback Credit Card", subtitle: "****9053", cardNumber: "****9053", balance: 1234.56, balanceLabel: "Balance after pending", availableCredit: 2765.44, onPress: () => console.log("Credit card pressed") }} />
        <Tile type="creditCard" data={{ id: "cashback-card", title: "Cashback Credit Card", subtitle: "****9053", cardNumber: "****9053", balance: 1234.56, balanceLabel: "Balance after pending", availableCredit: 2765.44, onPress: () => console.log("Credit card pressed") }} />
        {/* Add more tiles as needed */}
    </View>
);

export default App;
