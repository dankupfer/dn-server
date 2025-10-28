// src/modules/core/figma-router/index.tsx
import React, { useState, useRef, createContext, useContext } from 'react';
import {
  View,
  ScrollView,
  Platform,
  Animated as RNAnimated,
  TouchableOpacity,
  Text,
  Modal,
} from 'react-native';
import {
  Tabs,
  BottomNav,
  useTheme,
  useHeader,
  useFlags,
  AssistJourney,
  ScreenBuilder,
  HeaderManager
} from '@dankupfer/dn-components';
import { createFigmaRouterStyles } from './styles';
import { carouselRoutes } from './carouselRoutes';
import { bottomNavRoutes } from './bottomNavRoutes';
import { childRoutes } from './childRoutes';

// Context for navigation
interface NavigationContextType {
  navigateToChild: (childId: string) => void;
  goBack: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within FigmaRouter');
  }
  return context;
};

// Context for FigmaTile to trigger the journey
interface FigmaContextType {
  openFigma: () => void;
}

const FigmaContext = createContext<FigmaContextType | undefined>(undefined);

export const useFigma = () => {
  const context = useContext(FigmaContext);
  if (!context) {
    throw new Error('useFigma must be used within FigmaRouter');
  }
  return context;
};

interface FigmaRouterProps {
  screenWidth: number;
}

const userData = {
  name: 'Daniel',
  greeting: 'Hi',
  notificationCount: 99
};

const FigmaRouter: React.FC<FigmaRouterProps> = ({ screenWidth }) => {
  const { theme } = useTheme();
  const { flags } = useFlags();
  const { replace, stackSize } = useHeader();
  const styles = createFigmaRouterStyles(theme);

  const HEADER_HEIGHT = 60;

  // Build carousel sections dynamically from routes
  const carouselSections = carouselRoutes.map(route => ({
    id: route.id,
    title: route.name,
    moduleId: route.id
  }));

  // Separate bottom nav tabs and modals
  const bottomNavTabs = bottomNavRoutes.filter(r => r.type === 'tab');
  const bottomNavModals = bottomNavRoutes.filter(r => r.type === 'modal');

  // Figma journey state
  const [isFigmaOpen, setIsFigmaOpen] = useState(false);
  const slideAnim = useRef(new RNAnimated.Value(0)).current;
  const figmaSlideAnim = useRef(new RNAnimated.Value(screenWidth)).current;

  // Carousel state
  const [activeSection, setActiveSection] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Bottom navigation state - defaults to 'home' if it exists, otherwise first tab
  const defaultBottomSection = bottomNavTabs.find(t => t.id === 'home')?.id || bottomNavTabs[0]?.id || 'home';
  const [activeBottomSection, setActiveBottomSection] = useState<string>(defaultBottomSection);

  // Timers for web scrolling
  const scrollTimer = useRef<NodeJS.Timeout | null>(null);
  const lastScrollPosition = useRef(0);

  // Figma journey handlers
  const handleOpenFigma = () => {
    setIsFigmaOpen(true);

    // Animate main content left
    RNAnimated.timing(slideAnim, {
      toValue: -screenWidth,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Animate FigmaJourney in from right
    RNAnimated.timing(figmaSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleCloseFigma = () => {
    // Animate main content back
    RNAnimated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Animate FigmaJourney out to right
    RNAnimated.timing(figmaSlideAnim, {
      toValue: screenWidth,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsFigmaOpen(false);
    });
  };

  // Set header based on active section
  React.useEffect(() => {
    if (stackSize > 1) return; // Don't update header when in detail view

    // Find the active tab route
    const activeRoute = bottomNavTabs.find(r => r.id === activeBottomSection);
    const title = activeRoute?.id === 'home'
      ? `${userData.greeting}, ${userData.name}`
      : activeRoute?.name || 'App';

    replace({
      id: `${activeBottomSection}-main`,
      title,
      showStatusBar: true,
      rightActions: activeRoute?.id === 'home' ? [
        {
          type: 'notification',
          notificationCount: userData.notificationCount,
          onPress: () => console.log('Notifications pressed'),
          accessibilityLabel: 'View notifications'
        },
        {
          type: 'custom',
          iconName: 'icons|miscellaneous|settings',
          onPress: () => console.log('Settings pressed'),
          accessibilityLabel: 'Settings'
        }
      ] : [
        {
          type: 'custom',
          iconName: 'icons|miscellaneous|settings',
          onPress: () => console.log('Settings pressed'),
          accessibilityLabel: 'Settings'
        }
      ]
    });
  }, [activeBottomSection, replace, stackSize]);

  // Tab press handler
  const handleTabPress = (index: number) => {
    if (activeBottomSection !== 'home') return;
    setActiveSection(index);
    scrollViewRef.current?.scrollTo({
      x: index * screenWidth,
      animated: false,
    });
  };

  // Horizontal scroll handlers
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

  // Bottom navigation handler
  const handleBottomSectionChange = (sectionId: string) => {
    setActiveBottomSection(sectionId);
    if (sectionId === 'home') {
      setActiveSection(0);
      setScrollProgress(0);
      scrollViewRef.current?.scrollTo({ x: 0, animated: false });
    }
  };

  // Render carousel section content
  const renderSectionContent = (sectionIndex: number) => {
    const route = carouselRoutes[sectionIndex];

    if (route) {
      const Component = route.component;
      return (
        <View style={{ width: screenWidth, flex: 1 }}>
          <Component screenWidth={screenWidth} />
        </View>
      );
    }

    // Fallback placeholder using ScreenBuilder
    const placeholderConfig = {
      scrollable: true,
      components: [
        {
          type: 'SectionHeader',
          props: { title: 'Section Not Found' }
        },
        {
          type: 'ServiceCard',
          props: {
            id: 'placeholder',
            title: 'Coming Soon',
            description: 'This section is not yet configured',
            icon: { name: 'icons|miscellaneous|settings', color: theme.colors.brandAccent.background },
            showArrow: false,
            onPress: () => console.log('Placeholder pressed')
          }
        }
      ]
    };

    return (
      <View style={{ width: screenWidth, flex: 1 }}>
        <ScreenBuilder
          config={placeholderConfig}
          screenWidth={screenWidth}
          testID="section-placeholder"
        />
      </View>
    );
  };

  // Render main content based on active bottom section
  const renderMainContent = () => {
    // HOME section = show the carousel
    if (activeBottomSection === 'home') {
      return (
        <View style={{ marginTop: HEADER_HEIGHT, flex: 1 }}>
          {/* Top Navigation Pills */}
          <Tabs
            tabs={carouselSections}
            activeTab={activeSection}
            scrollProgress={scrollProgress}
            onTabPress={handleTabPress}
            isDragging={isDragging}
            screenWidth={screenWidth}
          />

          {/* Horizontal Carousel Content */}
          <ScrollView
            ref={scrollViewRef}
            horizontal
            bounces={false}
            alwaysBounceHorizontal={false}
            alwaysBounceVertical={false}
            pagingEnabled={true}
            nestedScrollEnabled={true}
            directionalLockEnabled={true}
            showsHorizontalScrollIndicator={false}
            onScrollBeginDrag={handleScrollBegin}
            onScroll={handleHorizontalScroll}
            onMomentumScrollEnd={Platform.OS !== 'web' ? handleHorizontalScrollEnd : undefined}
            scrollEventThrottle={16}
            style={{ flex: 1 }}
          >
            {carouselRoutes.map((route, index) => (
              <React.Fragment key={route.id}>
                {renderSectionContent(index)}
              </React.Fragment>
            ))}
          </ScrollView>
        </View>
      );
    }

    // Otherwise, render the active bottom nav tab
    const activeTabRoute = bottomNavTabs.find(r => r.id === activeBottomSection);

    if (activeTabRoute) {
      const Component = activeTabRoute.component;
      return (
        <View style={{ marginTop: HEADER_HEIGHT, flex: 1 }}>
          <Component screenWidth={screenWidth} />
        </View>
      );
    }

    // Fallback
    return (
      <View style={{ marginTop: HEADER_HEIGHT, flex: 1 }}>
        <ScreenBuilder
          config={{
            scrollable: true,
            components: [
              {
                type: 'SectionHeader',
                props: { title: 'Section Not Found' }
              }
            ]
          }}
          screenWidth={screenWidth}
          testID="fallback"
        />
      </View>
    );
  };

  // Modal overlay state
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Child route navigation state
  const [activeChildRoute, setActiveChildRoute] = useState<string | null>(null);
  const childSlideAnim = useRef(new RNAnimated.Value(screenWidth)).current;

  // Handle modal overlay open/close
  const handleOverlayOpen = (modalId: string) => {
    console.log(`Opening modal: ${modalId}`);
    setActiveModal(modalId);
  };

  const handleOverlayClose = () => {
    console.log('Closing modal');
    setActiveModal(null);
  };

  // Handle child route navigation
  const navigateToChild = (childId: string) => {
    console.log(`Navigating to child: ${childId}`);
    const childRoute = childRoutes.find(r => r.id === childId);

    if (!childRoute) {
      console.warn(`Child route not found: ${childId}`);
      return;
    }

    setActiveChildRoute(childId);

    // Animate based on type
    if (childRoute.type === 'slide') {
      // Slide in from right
      RNAnimated.timing(childSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (childRoute.type === 'modal') {
      // Modal animation (could be different)
      RNAnimated.timing(childSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (childRoute.type === 'full') {
      // Full screen (no animation or different animation)
      childSlideAnim.setValue(0);
    }
  };

  const goBack = () => {
    console.log('Going back from child route');

    // Animate out
    RNAnimated.timing(childSlideAnim, {
      toValue: screenWidth,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setActiveChildRoute(null);
    });
  };

  // Render active modal overlay
  const renderModalOverlay = () => {
    if (!activeModal) return null;

    const modalRoute = bottomNavModals.find(r => r.id === activeModal);
    if (!modalRoute) return null;

    const Component = modalRoute.component;

    return (
      <Modal
        visible={!!activeModal}
        transparent={false}
        presentationStyle="pageSheet"
        animationType="slide"
        onRequestClose={handleOverlayClose}
      >
        <View style={{
          flex: 1,
          backgroundColor: theme.colors.page.background
        }}>
          <View style={{
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border.default,
          }}>
            <View style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.colors.border.default,
            }} />
          </View>
          <Component screenWidth={screenWidth} />
        </View>
      </Modal>
    );
  };

  // Render child route overlay
  const renderChildRouteOverlay = () => {
    if (!activeChildRoute) return null;

    const childRoute = childRoutes.find(r => r.id === activeChildRoute);
    if (!childRoute) return null;

    const Component = childRoute.component;

    // Different rendering based on type
    if (childRoute.type === 'modal') {
      return (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              backgroundColor: theme.colors.page.background,
              borderRadius: 16,
              width: '90%',
              maxHeight: '80%',
              padding: 16,
            }}
          >
            <Component screenWidth={screenWidth * 0.9} />
            <TouchableOpacity
              style={{
                marginTop: 16,
                padding: 12,
                alignItems: 'center',
              }}
              onPress={goBack}
            >
              <Text style={{ color: theme.colors.text.default }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Slide or full screen
    return (
      <RNAnimated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: theme.colors.page.background,
          transform: [{ translateX: childSlideAnim }],
        }}
      >
        <View style={{ flex: 1, marginTop: HEADER_HEIGHT }}>
          <Component screenWidth={screenWidth} />
          <TouchableOpacity
            style={{
              padding: 16,
              alignItems: 'center',
              borderTopWidth: 1,
              borderTopColor: theme.colors.border.default,
            }}
            onPress={goBack}
          >
            <Text style={{ color: theme.colors.text.default }}>← Back</Text>
          </TouchableOpacity>
        </View>
      </RNAnimated.View>
    );
  };

  // Render bottom navigation
  const renderBottomNavigation = () => {
    // Build bottom nav items respecting the order from bottomNavRoutes
    const allItems = bottomNavRoutes.map(route => ({
      id: route.id,
      label: route.name,
      iconDefault: route.type === 'tab'
        ? 'components|bottom_navigation|tab_1_default'
        : 'components|bottom_navigation|tab_3_default',
      iconActive: route.type === 'tab'
        ? 'components|bottom_navigation|tab_1_default'
        : 'components|bottom_navigation|tab_3_default',
      onPress: () => console.log(`${route.name} pressed`)
    }));

    // Extract IDs in order
    const tabIds = bottomNavRoutes.filter(r => r.type === 'tab').map(r => r.id);
    const modalIds = bottomNavRoutes.filter(r => r.type === 'modal').map(r => r.id);

    return (
      <BottomNav
        activeSection={activeBottomSection}
        onSectionChange={handleBottomSectionChange}
        onOverlayOpen={handleOverlayOpen}
        data={{ items: allItems }}
        sectionTabs={tabIds}
        overlayTabs={modalIds}
      />
    );
  };

  return (
    <NavigationContext.Provider value={{ navigateToChild, goBack }}>
      <FigmaContext.Provider value={{ openFigma: handleOpenFigma }}>
        <View style={styles.dashboardContainer}>
          {/* Main app content - slides left when FigmaJourney opens */}
          <RNAnimated.View
            style={[
              { flex: 1 },
              { transform: [{ translateX: slideAnim }] }
            ]}
          >
            {/* HeaderManager - inside animated view */}
            <HeaderManager animationDuration={300} debug={false} />

            {/* Main Content - changes based on bottom navigation */}
            {renderMainContent()}

            {/* Bottom Navigation */}
            {renderBottomNavigation()}

            {/* Modal Overlays */}
            {renderModalOverlay()}

            {/* Child Route Overlays */}
            {renderChildRouteOverlay()}
          </RNAnimated.View>

          {/* FigmaJourney Overlay - slides in from right */}
          {isFigmaOpen && (
            <RNAnimated.View
              style={[
                {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: theme.colors.page.background,
                },
                { transform: [{ translateX: figmaSlideAnim }] }
              ]}
            >
              <AssistJourney
                screenWidth={screenWidth}
                onClose={handleCloseFigma}
                assistantConfig={{
                  serverUrl: 'ws://localhost:3001/api/assist',
                  debug: false,
                  useMockMode: true,
                }}
                enableTTS={true}
              />
            </RNAnimated.View>
          )}
        </View>
      </FigmaContext.Provider>
    </NavigationContext.Provider>
  );
};

export default FigmaRouter;