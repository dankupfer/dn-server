// template/src/modules/core/combined-auth/index.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Alert,
  Dimensions,
  Modal
} from 'react-native';

// Import components from dn-components
import {
  Header,
  Tabs,
  BottomNav,
  ScreenBuilder,
  useTheme,
  ActionButton
} from '@dankupfer/dn-components';

// Import feature components (non-carousel screens)
import Apply from '../../feature/apply';
import Cards from '../../feature/cards';

// Import abstracted screen routing
import { screenRoutes } from './screenRoutes';

// Import styles (simplified now)
import { createCombinedAuthStyles } from './styles';

// Define the different states/screens
type AppState = 'splash' | 'login' | 'register' | 'dashboard';

// Define TabItem type locally
type TabItem = {
  id: string;
  title: string;
  moduleId: string;
};

const carouselSections: TabItem[] = [
  { id: 'summary', title: 'Summary', moduleId: 'summary' },
  { id: 'everyday', title: 'Everyday', moduleId: 'everyday' },
  { id: 'save-invest', title: 'Save & Invest', moduleId: 'save-invest' },
  { id: 'homes', title: 'Homes', moduleId: 'homes' },
  { id: 'borrow', title: 'Borrow', moduleId: 'borrow' },
];

// User data for the header
const userData = {
  name: 'Daniel',
  greeting: 'Hi',
  notificationCount: 99
};

// Mock user data type
interface User {
  id: string;
  name: string;
  email: string;
}

const CombinedAuthModule: React.FC = () => {
  // Get theme from context
  const { theme } = useTheme();

  // Create theme-aware styles (much simpler now)
  const styles = createCombinedAuthStyles(theme);

  // Dev flag - set to true to skip splash/auth and go straight to dashboard
  const DEV_SKIP_AUTH = true;

  // State management
  const [currentState, setCurrentState] = useState<AppState>(DEV_SKIP_AUTH ? 'dashboard' : 'splash');
  const [user, setUser] = useState<User | null>(DEV_SKIP_AUTH ? { id: 'dev', name: 'Alex', email: 'dev@example.com' } : null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Carousel state
  const [activeSection, setActiveSection] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const screenWidth = Dimensions.get('window').width;

  // Bottom navigation state
  const [activeBottomSection, setActiveBottomSection] = useState<string>('home');

  // Overlay state management
  const [activeOverlay, setActiveOverlay] = useState<string | null>(null);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Splash screen timer
  useEffect(() => {
    if (!DEV_SKIP_AUTH) {
      const timer = setTimeout(() => {
        setCurrentState('login');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [DEV_SKIP_AUTH]);

  // Authentication functions (unchanged)
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const mockUser: User = {
        id: '1',
        name: name || 'John Doe',
        email: email,
      };
      setUser(mockUser);
      setCurrentState('dashboard');
      setLoading(false);
    }, 1500);
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const mockUser: User = {
        id: '2',
        name: name,
        email: email,
      };
      setUser(mockUser);
      setCurrentState('dashboard');
      setLoading(false);
    }, 1500);
  };

  const handleLogout = () => {
    setUser(null);
    setEmail('');
    setPassword('');
    setName('');
    setCurrentState('login');
  };

  // Navigation functions
  const handleBottomSectionChange = (sectionId: string) => {
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

  const handleTabPress = (index: number) => {
    if (activeBottomSection !== 'home') return;

    setActiveSection(index);
    scrollViewRef.current?.scrollTo({
      x: index * screenWidth,
      animated: false,
    });
  };

  const handleScrollBegin = () => {
    setIsDragging(true);
  };

  const scrollTimer = useRef<NodeJS.Timeout | null>(null);
  const lastScrollPosition = useRef(0);

  const handleScroll = (event: any) => {
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
        handleScrollStop();
      }, 150);
    }
  };

  const handleScrollStop = () => {
    setIsDragging(false);
    const currentIndex = Math.round(lastScrollPosition.current / screenWidth);
    scrollViewRef.current?.scrollTo({
      x: currentIndex * screenWidth,
      animated: true,
    });
    if (currentIndex !== activeSection) {
      setActiveSection(currentIndex);
    }
  };

  const handleScrollEnd = (event: any) => {
    setIsDragging(false);
    const contentOffset = event.nativeEvent.contentOffset;
    const currentIndex = Math.round(contentOffset.x / screenWidth);
    if (currentIndex !== activeSection) {
      setActiveSection(currentIndex);
    }
  };

  // Render section content using ScreenBuilder or fallback
  const renderSectionContent = (sectionIndex: number) => {
    const section = carouselSections[sectionIndex];
    const route = screenRoutes.find(r => r.id === section.id);

    if (route) {
      const Component = route.component;
      return <Component screenWidth={screenWidth} />;
    }

    // Fallback using ScreenBuilder with placeholder content
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
            icon: { name: 'settings', color: '#006a4e' },
            showArrow: false,
            onPress: () => console.log(`${section.title} placeholder pressed`)
          }
        }
      ]
    };

    return (
      <ScreenBuilder
        config={placeholderConfig}
        screenWidth={screenWidth}
        testID={`section-${section.id}`}
      />
    );
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
          <View style={{padding: 20}}>
            <ActionButton
              label='Close'
              onPress={handleOverlayClose}
            />
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  // Main content rendering
  const renderMainContent = () => {
    switch (activeBottomSection) {
      case 'apply':
        return (
          <Apply
            onLogout={handleLogout}
            userData={userData}
          />
        );
      case 'cards':
        return (
          <Cards
            onLogout={handleLogout}
            userData={userData}
          />
        );
      case 'home':
      default:
        return (
          <>
            {/* Header using dn-components */}
            <Header
              title={`${userData.greeting}, ${user?.name || userData.name}`}
              rightActions={[
                {
                  type: 'notification',
                  notificationCount: userData.notificationCount,
                  onPress: () => console.log('Notifications pressed'),
                },
                {
                  type: 'custom',
                  iconName: 'icons|miscellaneous|settings',
                  onPress: handleLogout,
                  accessibilityLabel: 'Logout',
                }
              ]}
            />

            {/* Tabs using dn-components */}
            <Tabs
              tabs={carouselSections}
              activeTab={activeSection}
              scrollProgress={scrollProgress}
              onTabPress={handleTabPress}
              screenWidth={screenWidth}
              isDragging={isDragging}
            />

            {/* Horizontal Carousel Content */}
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled={true}
              showsHorizontalScrollIndicator={false}
              onScrollBeginDrag={handleScrollBegin}
              onMomentumScrollEnd={Platform.OS !== 'web' ? handleScrollEnd : undefined}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              style={styles.carouselContainer}
            >
              {carouselSections.map((section, index) => (
                <View key={section.id} style={{ width: screenWidth, flex: 1 }}>
                  {renderSectionContent(index)}
                </View>
              ))}
            </ScrollView>
          </>
        );
    }
  };

  // Auth screen renders (simplified - could also use ScreenBuilder)
  const renderSplash = () => (
    <View style={styles.splashContainer}>
      <Text style={styles.splashTitle}>BankApp</Text>
      <Text style={styles.splashSubtitle}>Your Financial Partner</Text>
      <ActivityIndicator size="large" color={theme.colors.action.background} style={styles.splashLoader} />
    </View>
  );

  const renderLogin = () => (
    <SafeAreaView style={styles.authContainer}>
      <ScrollView contentContainerStyle={styles.authContent}>
        <Text style={styles.authTitle}>Welcome Back</Text>
        <Text style={styles.authSubtitle}>Sign in to your account</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={theme.colors.text.subdued}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={theme.colors.text.subdued}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.disabledButton]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.primaryButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setCurrentState('register')}
        >
          <Text style={styles.secondaryButtonText}>
            Don't have an account? Sign Up
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );

  const renderRegister = () => (
    <SafeAreaView style={styles.authContainer}>
      <ScrollView contentContainerStyle={styles.authContent}>
        <Text style={styles.authTitle}>Create Account</Text>
        <Text style={styles.authSubtitle}>Join us today</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor={theme.colors.text.subdued}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={theme.colors.text.subdued}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={theme.colors.text.subdued}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.disabledButton]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.primaryButtonText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setCurrentState('login')}
        >
          <Text style={styles.secondaryButtonText}>
            Already have an account? Sign In
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );

  const renderDashboard = () => (
    <SafeAreaView style={styles.dashboardContainer}>
      {renderMainContent()}

      {/* Bottom Navigation - NOW USING dn-components */}
      <BottomNav
        activeSection={activeBottomSection}
        onSectionChange={handleBottomSectionChange}
        onOverlayOpen={handleOverlayOpen}
      />

      {renderOverlay()}
    </SafeAreaView>
  );

  // Main render function
  const renderCurrentScreen = () => {
    switch (currentState) {
      case 'splash':
        return renderSplash();
      case 'login':
        return renderLogin();
      case 'register':
        return renderRegister();
      case 'dashboard':
        return renderDashboard();
      default:
        return renderSplash();
    }
  };

  return <View style={styles.container}>{renderCurrentScreen()}</View>;
};

export default CombinedAuthModule;