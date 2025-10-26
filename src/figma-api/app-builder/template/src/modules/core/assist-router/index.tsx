// src/modules/core/assist-router/index.tsx
import React, { useState, useRef, createContext, useContext } from 'react';
import {
  View,
  ScrollView,
  Platform,
  Animated as RNAnimated,
} from 'react-native';
import {
  Tabs,
  BottomNav,
  BottomNav2,
  useTheme,
  useHeader,
  useFlags,
  AssistJourney,
  ScreenBuilder,
  HeaderManager  // ADD THIS IMPORT
} from '@dankupfer/dn-components';
import { createSummaryRouterStyles } from './styles';
import { screenRoutes } from './screenRoutes';

// Import feature components for non-home sections
import Apply from '../../feature/apply';
import Cards from '../../feature/cards';

// Context for AssistTile to trigger the journey
interface AssistContextType {
  openAssist: () => void;
}

const AssistContext = createContext<AssistContextType | undefined>(undefined);

export const useAssist = () => {
  const context = useContext(AssistContext);
  if (!context) {
    throw new Error('useAssist must be used within AssistRouter');
  }
  return context;
};

interface AssistRouterProps {
  screenWidth: number;
}

// Tab sections for horizontal carousel
const carouselSections = [
  { id: 'summary', title: 'Summary', moduleId: 'summary' },
  { id: 'everyday', title: 'Everyday', moduleId: 'everyday' },
  { id: 'save-invest', title: 'Save & Invest', moduleId: 'save-invest' },
  { id: 'homes', title: 'Homes', moduleId: 'homes' },
  { id: 'borrow', title: 'Borrow', moduleId: 'borrow' },
];

const userData = {
  name: 'Daniel',
  greeting: 'Hi',
  notificationCount: 99
};

const AssistRouter: React.FC<AssistRouterProps> = ({ screenWidth }) => {
  const { theme } = useTheme();
  const { flags } = useFlags();
  const { replace, stackSize } = useHeader();
  const styles = createSummaryRouterStyles(theme);

  const HEADER_HEIGHT = 60;

  // Assist journey state
  const [isAssistOpen, setIsAssistOpen] = useState(false);
  const slideAnim = useRef(new RNAnimated.Value(0)).current;
  const assistSlideAnim = useRef(new RNAnimated.Value(screenWidth)).current;

  // Carousel state
  const [activeSection, setActiveSection] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Bottom navigation state
  const [activeBottomSection, setActiveBottomSection] = useState<string>('home');

  // Timers for web scrolling
  const scrollTimer = useRef<NodeJS.Timeout | null>(null);
  const lastScrollPosition = useRef(0);

  // Assist journey handlers
  const handleOpenAssist = () => {
    setIsAssistOpen(true);
    
    // Animate main content left
    RNAnimated.timing(slideAnim, {
      toValue: -screenWidth,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Animate AssistJourney in from right
    RNAnimated.timing(assistSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleCloseAssist = () => {
    // Animate main content back
    RNAnimated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Animate AssistJourney out to right
    RNAnimated.timing(assistSlideAnim, {
      toValue: screenWidth,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsAssistOpen(false);
    });
  };

  // Set header based on active section
  React.useEffect(() => {
    if (stackSize > 1) return; // Don't update header when in detail view

    if (activeBottomSection === 'home') {
      replace({
        id: 'assist-main',
        title: `${userData.greeting}, ${userData.name}`,
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
            onPress: () => console.log('Settings pressed'),
            accessibilityLabel: 'Settings'
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
            onPress: () => console.log('Settings pressed'),
            accessibilityLabel: 'Settings'
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
            onPress: () => console.log('Settings pressed'),
            accessibilityLabel: 'Settings'
          }
        ]
      });
    }
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

  // Render section content using screen routes with placeholder fallback
  const renderSectionContent = (sectionIndex: number) => {
    const section = carouselSections[sectionIndex];
    const route = screenRoutes.find(r => r.id === section.id);

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
          props: { title: `${section.title} Module` }
        },
        {
          type: 'ServiceCard',
          props: {
            id: `${section.id}-placeholder`,
            title: 'Coming Soon',
            description: `This section will load the ${section.moduleId} module`,
            icon: { name: 'icons|miscellaneous|settings', color: theme.colors.brandAccent.background },
            showArrow: false,
            onPress: () => console.log(`${section.title} placeholder pressed`)
          }
        }
      ]
    };

    return (
      <View style={{ width: screenWidth, flex: 1 }}>
        <ScreenBuilder
          config={placeholderConfig}
          screenWidth={screenWidth}
          testID={`section-${section.id}`}
        />
      </View>
    );
  };

  // Render main content based on active bottom section
  const renderMainContent = () => {
    switch (activeBottomSection) {
      case 'apply':
        return (
          <View style={{ marginTop: HEADER_HEIGHT, flex: 1 }}>
            <Apply onLogout={() => console.log('Logout')} userData={userData} />
          </View>
        );
      case 'cards':
        return (
          <View style={{ marginTop: HEADER_HEIGHT, flex: 1 }}>
            <Cards onLogout={() => console.log('Logout')} userData={userData} />
          </View>
        );
      case 'home':
      default:
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
              {carouselSections.map((section, index) => (
                <React.Fragment key={section.id}>
                  {renderSectionContent(index)}
                </React.Fragment>
              ))}
            </ScrollView>
          </View>
        );
    }
  };

  // Render bottom navigation
  const renderBottomNavigation = () => {
    const useBottomNav2 = flags.experimental?.bottomNav2 ?? false;
    const baseNavProps = {
      activeSection: activeBottomSection,
      onSectionChange: handleBottomSectionChange,
      onOverlayOpen: () => { },
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
        />
      );
    } else {
      const bottomNavData = {
        items: [
          { id: 'home', label: 'Home', iconDefault: 'components|bottom_navigation|tab_1_default', iconActive: 'components|bottom_navigation|tab_1_default', onPress: () => console.log('Home pressed') },
          { id: 'apply', label: 'Apply', iconDefault: 'components|bottom_navigation|tab_2_default', iconActive: 'components|bottom_navigation|tab_2_default', onPress: () => console.log('Apply pressed') },
          { id: 'cards', label: 'Cards', iconDefault: 'components|bottom_navigation|tab_5_default', iconActive: 'components|bottom_navigation|tab_5_default', onPress: () => console.log('Cards pressed') },
        ],
      };

      return (
        <BottomNav
          {...baseNavProps}
          data={bottomNavData}
          sectionTabs={['home', 'apply', 'cards']}
          overlayTabs={[]}
          onOverlayOpen={() => { }}
        />
      );
    }
  };

  return (
    <AssistContext.Provider value={{ openAssist: handleOpenAssist }}>
      <View style={styles.dashboardContainer}>
        {/* Main app content - slides left when AssistJourney opens */}
        <RNAnimated.View
          style={[
            { flex: 1 },
            { transform: [{ translateX: slideAnim }] }
          ]}
        >
          {/* ADD HeaderManager HERE - inside animated view */}
          <HeaderManager animationDuration={300} debug={false} />
          
          {/* Main Content - changes based on bottom navigation */}
          {renderMainContent()}

          {/* Bottom Navigation */}
          {renderBottomNavigation()}
        </RNAnimated.View>

        {/* AssistJourney Overlay - slides in from right */}
        {isAssistOpen && (
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
              { transform: [{ translateX: assistSlideAnim }] }
            ]}
          >
            <AssistJourney
              screenWidth={screenWidth}
              onClose={handleCloseAssist}
              assistantConfig={{
                // serverUrl: 'wss://dn-server-974885144591.us-central1.run.app/api/assist',
                serverUrl: 'ws://localhost:3001/api/assist',
                debug: false,
                useMockMode: true,
              }}
              enableTTS={true}
            />
          </RNAnimated.View>
        )}
      </View>
    </AssistContext.Provider>
  );
};

export default AssistRouter;