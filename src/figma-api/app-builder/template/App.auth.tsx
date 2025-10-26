// App.auth.tsx  
/**
 * AUTH STARTER TEMPLATE
 * 
 * Authentication-enabled app with login/register flow and basic dashboard.
 * Good starting point for apps requiring user authentication.
 * 
 * INCLUDED MODULES:
 * - Authentication flow (login/register)
 * - Basic dashboard with navigation
 * - User profile management
 * - (At the moment it has no real module dependancies – but I'd like to connect to main-navigator in a near future)
 * 
 * FEATURES:
 * - Complete auth flow with form validation
 * - User state management
 * - 3-screen dashboard (Home, Profile, Settings)
 * - Mock API simulation
 * - Session management
 * 
 * DEPENDENCIES:
 * - React Native core components only
 * 
 * USE CASE: Apps with user accounts, personalized content, secure features
 */



import React, { useState } from 'react';
import { 
  SafeAreaView, 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import packageJson from './package.json';

// Types
interface User {
  id: string;
  name: string;
  email: string;
}

type AuthScreen = 'login' | 'register';
type AppScreen = 'home' | 'profile' | 'settings';

// Basic Card component
const BasicCard: React.FC<{ title: string; content: string; onPress?: () => void }> = ({ 
  title, 
  content, 
  onPress 
}) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardContent}>{content}</Text>
    {onPress && <Text style={styles.cardArrow}>→</Text>}
  </TouchableOpacity>
);

export default function App() {
  const appVersion = packageJson.version;
  const appName = packageJson.name;

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');
  const [loading, setLoading] = useState(false);

  // App state
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('home');

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  console.log(`\n\n\n\n==================================\n\n${appName} (Auth) started: version ${appVersion}\n\n==================================`);

  // Auth functions
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const mockUser: User = {
        id: '1',
        name: name || 'John Doe',
        email: email,
      };
      
      setUser(mockUser);
      setLoading(false);
      Alert.alert('Success', 'Logged in successfully!');
    }, 1500);
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const mockUser: User = {
        id: '2',
        name: name,
        email: email,
      };
      
      setUser(mockUser);
      setLoading(false);
      Alert.alert('Success', 'Account created successfully!');
    }, 1500);
  };

  const handleLogout = () => {
    setUser(null);
    setEmail('');
    setPassword('');
    setName('');
    Alert.alert('Success', 'Logged out successfully!');
  };

  // Auth screens
  const renderLogin = () => (
    <ScrollView style={styles.authContent} showsVerticalScrollIndicator={false}>
      <View style={styles.authHeader}>
        <Text style={styles.authTitle}>Welcome Back</Text>
        <Text style={styles.authSubtitle}>Sign in to your account</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
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
        onPress={() => setAuthScreen('register')}
      >
        <Text style={styles.secondaryButtonText}>
          Don't have an account? Sign Up
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderRegister = () => (
    <ScrollView style={styles.authContent} showsVerticalScrollIndicator={false}>
      <View style={styles.authHeader}>
        <Text style={styles.authTitle}>Create Account</Text>
        <Text style={styles.authSubtitle}>Join us today</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="#999"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
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
        onPress={() => setAuthScreen('login')}
      >
        <Text style={styles.secondaryButtonText}>
          Already have an account? Sign In
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // App screens
  const renderHome = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Welcome, {user?.name}!</Text>
        <Text style={styles.welcomeSubtitle}>Auth Starter Template</Text>
      </View>

      <BasicCard 
        title="Dashboard" 
        content="View your account overview and recent activity." 
        onPress={() => Alert.alert('Info', 'Dashboard feature coming soon!')}
      />
      
      <BasicCard 
        title="Quick Actions" 
        content="Access frequently used features and shortcuts." 
        onPress={() => Alert.alert('Info', 'Quick actions coming soon!')}
      />
      
      <BasicCard 
        title="Recent Activity" 
        content="Check your latest account activity and updates." 
        onPress={() => Alert.alert('Info', 'Activity feature coming soon!')}
      />
    </ScrollView>
  );

  const renderProfile = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Profile</Text>
        <Text style={styles.welcomeSubtitle}>Manage your account</Text>
      </View>

      <BasicCard 
        title="Personal Information" 
        content={`Name: ${user?.name}\nEmail: ${user?.email}\nUser ID: ${user?.id}`}
      />
      
      <BasicCard 
        title="Account Settings" 
        content="Update your password, email preferences, and security settings." 
        onPress={() => Alert.alert('Info', 'Account settings coming soon!')}
      />
      
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderSettings = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Settings</Text>
        <Text style={styles.welcomeSubtitle}>App preferences</Text>
      </View>

      <BasicCard 
        title="Notifications" 
        content="Manage your notification preferences and settings." 
        onPress={() => Alert.alert('Info', 'Notification settings coming soon!')}
      />
      
      <BasicCard 
        title="Privacy & Security" 
        content="Control your privacy settings and security options." 
        onPress={() => Alert.alert('Info', 'Privacy settings coming soon!')}
      />
      
      <BasicCard 
        title="About" 
        content={`App: ${appName}\nVersion: ${appVersion}\nTemplate: Auth Starter`}
      />
    </ScrollView>
  );

  const renderAppContent = () => {
    switch (currentScreen) {
      case 'home':
        return renderHome();
      case 'profile':
        return renderProfile();
      case 'settings':
        return renderSettings();
      default:
        return renderHome();
    }
  };

  // Main render
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authContainer}>
          {authScreen === 'login' ? renderLogin() : renderRegister()}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{appName}</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.headerLogout}>
          <Text style={styles.headerLogoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {renderAppContent()}

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={[styles.navButton, currentScreen === 'home' && styles.navButtonActive]}
          onPress={() => setCurrentScreen('home')}
        >
          <Text style={[styles.navButtonText, currentScreen === 'home' && styles.navButtonTextActive]}>
            Home
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navButton, currentScreen === 'profile' && styles.navButtonActive]}
          onPress={() => setCurrentScreen('profile')}
        >
          <Text style={[styles.navButtonText, currentScreen === 'profile' && styles.navButtonTextActive]}>
            Profile
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navButton, currentScreen === 'settings' && styles.navButtonActive]}
          onPress={() => setCurrentScreen('settings')}
        >
          <Text style={[styles.navButtonText, currentScreen === 'settings' && styles.navButtonTextActive]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  
  // Auth styles
  authContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  authContent: {
    flex: 1,
    padding: 24,
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  authTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 16,
    color: '#666666',
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 14,
  },

  // App styles
  header: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
  },
  headerLogout: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ff4444',
    borderRadius: 6,
  },
  headerLogoutText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    flex: 1,
  },
  cardContent: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    flex: 1,
  },
  cardArrow: {
    fontSize: 18,
    color: '#007AFF',
    marginLeft: 8,
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 8,
  },
  navButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  navButtonActive: {
    backgroundColor: '#007AFF',
    marginHorizontal: 4,
    borderRadius: 6,
  },
  navButtonText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  navButtonTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
});