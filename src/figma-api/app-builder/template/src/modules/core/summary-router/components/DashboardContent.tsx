// src/modules/core/summary-router/components/DashboardContent.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    SafeAreaView,
    ScrollView,
    Dimensions,
    Platform,
    Text,
    Modal,
    TouchableOpacity
} from 'react-native';
import {
    Tabs,
    BottomNav,
    BottomNav2,
    useTheme,
    ScreenBuilder,
    useHeader
} from '@dankupfer/dn-components';
import { useFlags } from '@dankupfer/dn-components';
import { createSummaryRouterStyles } from '../styles';
import { useScrollBehavior } from '../hooks/useScrollBehavior';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolate,
    Easing
} from 'react-native-reanimated';

// Import feature components for non-home sections
import Apply from '../../../feature/apply';
import Cards from '../../../feature/cards';

// Import screen routing for home sections
import { screenRoutes } from '../screenRoutes';
import { screenRoutes2 } from '../screenRoutes2';

import type { User } from '../../authentication';
import Summary from '@modules/feature/summary';

interface DashboardContentProps {
    user: User;
    onLogout: () => void;
    transitionSpeed: number;
}

// Tab sections for horizontal carousel
const carouselSections = [
    { id: 'summary', title: 'Summary', moduleId: 'summary' },
    { id: 'everyday', title: 'Everyday', moduleId: 'everyday' },
    { id: 'save-invest', title: 'Save & Invest', moduleId: 'save-invest' },
    { id: 'homes', title: 'Homes', moduleId: 'homes' },
    { id: 'borrow', title: 'Borrow', moduleId: 'borrow' },
];

// User data for header
const userData = {
    name: 'Daniel',
    greeting: 'Hi',
    notificationCount: 99
};

const DashboardContent: React.FC<DashboardContentProps> = ({ user, onLogout, transitionSpeed }) => {
    const { theme } = useTheme();
    const { flags } = useFlags();
    const { pop, replace, stackSize } = useHeader();
    const styles = createSummaryRouterStyles(theme);
    const screenWidth = Dimensions.get('window').width;

    // Calculate content positioning
    const tabsTranslateY = useSharedValue(0); // 0 = visible, -60 = hidden

    const HEADER_HEIGHT = 85;
    const TABS_HEIGHT = 40;

    // Base offset for HeaderManager + dynamic offset for account detail
    const baseContentOffset = HEADER_HEIGHT;
    // const dynamicOffset = stackSize > 1 ? -TABS_HEIGHT : 0; // Hide tabs when in account detail
    // const totalContentOffset = baseContentOffset + dynamicOffset;

    const contentOffsetY = useSharedValue(baseContentOffset);

    // Carousel state (horizontal navigation)
    const [activeSection, setActiveSection] = useState(0);
    const [scrollProgress, setScrollProgress] = useState(0);
    const scrollViewRef = useRef<ScrollView>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Bottom navigation state
    const [activeBottomSection, setActiveBottomSection] = useState<string>('home');

    // Overlay state management
    const [activeOverlay, setActiveOverlay] = useState<string | null>(null);
    const [isOverlayVisible, setIsOverlayVisible] = useState(false);

    // Timers for web scrolling
    const scrollTimer = useRef<NodeJS.Timeout | null>(null);
    const lastScrollPosition = useRef(0);

    // Scroll behavior hook for bottom nav animation
    const {
        isScrolling,
        shouldHideBottomNav,
        measureScrollViewBounds,
        handleScroll,
        handleScrollEnd,
        handleScrollBeginDrag,
        handleScrollEndDrag
    } = useScrollBehavior({
        enabled: true,
        debugMode: false, // Set to true if you want to see console logs
        scrollEndTimeout: 3000
    });

    const prevDepsRef = useRef<any>(0);
    const hasInitialized = useRef(false);

    useEffect(() => {
        const currentDeps = { activeBottomSection, user: user?.name };
        prevDepsRef.current = currentDeps;

        if (stackSize > 1) return
        if (activeBottomSection === 'home') {
            // Return to main dashboard header
            replace({
                id: 'dashboard-main',
                title: `${userData.greeting}, ${user?.name || userData.name}`,
                showStatusBar: true,
                rightActions: [
                    {
                        type: 'notification',
                        notificationCount: userData.notificationCount,
                        onPress: () => console.log('Notifications pressed'),
                        accessibilityLabel: 'View notifications'
                    },
                    {
                        type: 'custom',
                        iconName: 'icons|miscellaneous|settings',
                        onPress: onLogout,
                        accessibilityLabel: 'Logout'
                    }
                ]
            });
        } else if (activeBottomSection === 'apply') {
            replace({
                id: 'apply-main',
                title: 'Apply',
                showStatusBar: true,
                rightActions: [
                    {
                        type: 'custom',
                        iconName: 'icons|miscellaneous|settings',
                        onPress: onLogout,
                        accessibilityLabel: 'Logout'
                    }
                ]
            });
        } else if (activeBottomSection === 'cards') {
            replace({
                id: 'cards-main',
                title: 'Cards',
                showStatusBar: true,
                rightActions: [
                    {
                        type: 'custom',
                        iconName: 'icons|miscellaneous|settings',
                        onPress: onLogout,
                        accessibilityLabel: 'Logout'
                    }
                ]
            });
        }
    }, [activeBottomSection, user]);

    // Measure ScrollView bounds when component mounts
    useEffect(() => {
        measureScrollViewBounds(scrollViewRef);
    }, [measureScrollViewBounds]);

    // Handler for tab visibility changes from SummaryWallet
    const handleTabVisibilityChange = (shouldHide: boolean) => {
        // Animate tabs
        tabsTranslateY.value = withTiming(
            shouldHide ? -TABS_HEIGHT : 0,
            {
                duration: transitionSpeed,
                easing: Easing.out(Easing.cubic)
            }
        );

        // Animate content position - start this slightly later so it happens during the fade
        contentOffsetY.value = withTiming(
            shouldHide ? baseContentOffset - TABS_HEIGHT : baseContentOffset,
            {
                duration: transitionSpeed,
                easing: Easing.out(Easing.cubic)
            }
        );
    };

    // Create animated style for the home content
    const homeContentAnimatedStyle = useAnimatedStyle(() => ({
        marginTop: contentOffsetY.value
    }));

    // Animated style for tabs
    const tabsAnimatedStyle = useAnimatedStyle(() => ({
        opacity: interpolate(tabsTranslateY.value, [-TABS_HEIGHT, 0], [0, 1]),
        transform: [{ translateY: tabsTranslateY.value }]
    }));

    // Bottom navigation handlers
    const handleBottomSectionChange = (sectionId: string) => {
        // If we're in a detail view (stack size 2), pop back to main level first
        if (stackSize > 1) {
            console.log('[DashboardContent] Popping from detail view before bottom nav change');
            pop();
        }

        setActiveBottomSection(sectionId);
        if (sectionId === 'home') {
            setActiveSection(0);
            setScrollProgress(0);
            scrollViewRef.current?.scrollTo({ x: 0, animated: false });
        }
    };

    const handleOverlayOpen = (tabId: string) => {
        setActiveOverlay(tabId);
        setIsOverlayVisible(true);
    };

    const handleOverlayClose = () => {
        setIsOverlayVisible(false);
        // Clear the overlay data after animation completes
        setTimeout(() => {
            setActiveOverlay(null);
        }, 300); // Adjust timing as needed
    };

    // Tab press handler
    const handleTabPress = (index: number) => {
        if (activeBottomSection !== 'home') return;
        setActiveSection(index);
        scrollViewRef.current?.scrollTo({
            x: index * screenWidth,
            animated: false,
        });
    };

    // Horizontal scroll handlers (for tab animation)
    const handleHorizontalScroll = (event: any) => {
        if (activeBottomSection !== 'home') return;
        const contentOffset = event.nativeEvent.contentOffset;
        const progress = contentOffset.x / screenWidth;
        setScrollProgress(progress);
        lastScrollPosition.current = contentOffset.x;

        if (Platform.OS === 'web') {
            if (scrollTimer.current) {
                clearTimeout(scrollTimer.current);
            }
            scrollTimer.current = setTimeout(() => {
                handleHorizontalScrollStop();
            }, 150);
        }
    };

    const handleHorizontalScrollStop = () => {
        const currentIndex = Math.round(lastScrollPosition.current / screenWidth);
        scrollViewRef.current?.scrollTo({
            x: currentIndex * screenWidth,
            animated: true,
        });
        if (currentIndex !== activeSection) {
            setActiveSection(currentIndex);
        }
    };

    const handleHorizontalScrollEnd = (event: any) => {
        setIsDragging(false);
        const contentOffset = event.nativeEvent.contentOffset;
        const currentIndex = Math.round(contentOffset.x / screenWidth);
        if (currentIndex !== activeSection) {
            setActiveSection(currentIndex);
        }
    };

    const handleScrollBegin = () => {
        setIsDragging(true);
    };

    // Simplified overlay rendering
    const renderOverlay = () => {
        if (!activeOverlay) return null;

        const overlayConfig = {
            scrollable: false,
            components: [
                {
                    type: 'SectionHeader',
                    props: {
                        title: activeOverlay === 'payments' ? 'Payments' : 'Search'
                    }
                },
                {
                    type: 'ServiceCard',
                    props: {
                        id: 'overlay-content',
                        title: `${activeOverlay} overlay`,
                        description: `${activeOverlay} overlay content goes here`,
                        icon: { name: activeOverlay === 'payments' ? 'icons|cards|debit_card' : 'icons|cards|credit_card', color: '#006a4e' },
                        showArrow: false,
                        onPress: () => console.log(`${activeOverlay} overlay pressed`)
                    }
                }
            ]
        };

        return (
            <Modal
                visible={isOverlayVisible}
                transparent={false}
                presentationStyle="pageSheet"
                animationType="slide"
                onRequestClose={handleOverlayClose}
            >
                <SafeAreaView style={styles.overlayContainer}>
                    <ScreenBuilder
                        config={overlayConfig}
                        screenWidth={screenWidth}
                        style={styles.overlayContent}
                    />
                    <TouchableOpacity
                        style={styles.overlayCloseButton}
                        onPress={handleOverlayClose}
                    >
                        <Text style={styles.overlayCloseText}>Close</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </Modal>
        );
    };

    // Render section content using screen routes
    const renderSectionContent = (sectionIndex: number) => {
        const section = carouselSections[sectionIndex];

        const useSummaryWallet = flags.experimental?.summaryWallet ?? false;
        const route = useSummaryWallet ? screenRoutes.find(r => r.id === section.id) : screenRoutes2.find(r => r.id === section.id);

        // In renderSectionContent, for testing:
        // if (section.id === 'summary') {
        //     return (
        //         <View style={[{ width: screenWidth }, { flex: 1 }]}>
        //             <ScrollView
        //                 onScroll={handleScroll}
        //                 scrollEventThrottle={16}
        //             >
        //                 <Text>Test content</Text>
        //                 {/* Add enough content to make it scrollable */}
        //                 {Array.from({ length: 50 }, (_, i) => (
        //                     <Text key={i} style={{ padding: 20 }}>Item {i}</Text>
        //                 ))}
        //             </ScrollView>
        //         </View>
        //     );
        // }

        if (route) {
            const Component = route.component;

            // Pass the callback for summary section
            const props = {
                screenWidth,
                onScroll: handleScroll,
                onScrollEnd: handleScrollEnd,
                onScrollBeginDrag: handleScrollBeginDrag,
                onScrollEndDrag: handleScrollEndDrag,
                ...(section.id === 'summary' && {
                    onTabVisibilityChange: handleTabVisibilityChange,
                    transitionSpeed: transitionSpeed
                })
            };

            return (
                <View style={[{ width: screenWidth }, { flex: 1 }]}>
                    <Component {...props} />
                </View>
            );
        }

        // Fallback placeholder
        return (
            <View style={[{ width: screenWidth }, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ fontSize: 18, color: theme.colors.text.default }}>
                    {section.title} Module
                </Text>
                <Text style={{ fontSize: 14, color: theme.colors.text.subdued, marginTop: 8 }}>
                    Coming soon with module loading system
                </Text>
            </View>
        );
    };

    // Render main content based on active bottom section
    const renderMainContent = () => {
        switch (activeBottomSection) {
            case 'apply':
                return (
                    <View style={{ marginTop: baseContentOffset, flex: 1 }}>
                        <Apply onLogout={onLogout} userData={userData} />
                    </View>
                );
            case 'cards':
                return (
                    <View style={{ marginTop: baseContentOffset, flex: 1 }}>
                        <Cards onLogout={onLogout} userData={userData} />
                    </View>
                );
            case 'home':
            default:
                return (
                    <Animated.View style={[
                        {
                            flex: 1
                        },
                        homeContentAnimatedStyle
                    ]}>
                        {/* Animated Top Navigation Pills */}
                        <Animated.View style={tabsAnimatedStyle}>
                            <Tabs
                                tabs={carouselSections}
                                activeTab={activeSection}
                                scrollProgress={scrollProgress}
                                onTabPress={handleTabPress}
                                isDragging={isDragging}
                                screenWidth={screenWidth}
                            />
                        </Animated.View>

                        {/* Horizontal Carousel Content */}
                        <ScrollView
                            ref={scrollViewRef}
                            horizontal
                            bounces={false}                    // Add this
                            alwaysBounceHorizontal={false}     // Add this
                            alwaysBounceVertical={false}
                            pagingEnabled={true}
                            nestedScrollEnabled={true}
                            directionalLockEnabled={true}
                            showsHorizontalScrollIndicator={false}
                            onScrollBeginDrag={handleScrollBegin}
                            onScroll={handleHorizontalScroll}
                            onMomentumScrollEnd={Platform.OS !== 'web' ? handleHorizontalScrollEnd : undefined}
                            scrollEventThrottle={16}
                            style={styles.carouselContainer}
                            scrollEnabled={stackSize <= 1}
                        >
                            {carouselSections.map((section, index) => (
                                <React.Fragment key={section.id}>
                                    {renderSectionContent(index)}
                                </React.Fragment>
                            ))}
                        </ScrollView>
                    </Animated.View>
                );
        }
    };

    // Render bottom navigation
    const renderBottomNavigation = () => {
        const useBottomNav2 = flags.experimental?.bottomNav2 ?? false;
        const baseNavProps = {
            activeSection: activeBottomSection,
            onSectionChange: handleBottomSectionChange,
            onOverlayOpen: () => { }, // TODO: Add overlay functionality later
        };

        if (useBottomNav2) {
            const bottomNav2Data = {
                items: [
                    { id: 'home', label: 'Home', iconDefault: 'components|bottom_navigation|tab_1_default', iconActive: 'components|bottom_navigation|tab_1_default', onPress: () => console.log('Home pressed') },
                    { id: 'apply', label: 'Apply', iconDefault: 'components|bottom_navigation|tab_2_default', iconActive: 'components|bottom_navigation|tab_2_default', onPress: () => console.log('Apply pressed') },
                    { id: 'payments', label: 'Payments', iconDefault: 'components|bottom_navigation|tab_3_default', iconActive: 'components|bottom_navigation|tab_3_default', onPress: () => console.log('Payments pressed') },
                    { id: 'cards', label: 'Support', iconDefault: 'components|bottom_navigation|tab_5_default', iconActive: 'components|bottom_navigation|tab_5_default', onPress: () => console.log('Support pressed') },
                ],
            };

            return (
                <BottomNav2
                    {...baseNavProps}
                    data={bottomNav2Data}
                    sectionTabs={['home', 'apply', 'cards']}
                    overlayTabs={['payments']}
                    shouldHide={shouldHideBottomNav}
                    onOverlayOpen={handleOverlayOpen}
                />
            );
        } else {
            const bottomNavData = {
                items: [
                    { id: 'home', label: 'Home', iconDefault: 'components|bottom_navigation|tab_1_default', iconActive: 'components|bottom_navigation|tab_1_default', onPress: () => console.log('Home pressed') },
                    { id: 'apply', label: 'Apply', iconDefault: 'components|bottom_navigation|tab_2_default', iconActive: 'components|bottom_navigation|tab_2_default', onPress: () => console.log('Apply pressed') },
                    { id: 'payments', label: 'Payments', iconDefault: 'components|bottom_navigation|tab_3_default', iconActive: 'components|bottom_navigation|tab_3_default', onPress: () => console.log('Payments pressed') },
                    { id: 'search', label: 'Search', iconDefault: 'components|bottom_navigation|tab_4_default', iconActive: 'components|bottom_navigation|tab_4_default', onPress: () => console.log('Search pressed') },
                    { id: 'cards', label: 'Cards', iconDefault: 'components|bottom_navigation|tab_5_default', iconActive: 'components|bottom_navigation|tab_5_default', onPress: () => console.log('Cards pressed') },
                ],
            };

            return (
                <BottomNav
                    {...baseNavProps}
                    data={bottomNavData}
                    sectionTabs={['home', 'apply', 'cards']}
                    overlayTabs={['payments', 'search']}
                    onOverlayOpen={handleOverlayOpen}
                />
            );
        }
    };

    return (
        <SafeAreaView style={styles.dashboardContainer}>
            {renderMainContent()}
            {renderBottomNavigation()}
            {renderOverlay()}
        </SafeAreaView>
    );
};

export default DashboardContent;