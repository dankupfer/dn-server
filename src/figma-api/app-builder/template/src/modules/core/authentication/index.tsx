// src/modules/core/authentication/index.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Alert
} from 'react-native';
import { useTheme } from '@dankupfer/dn-components';
import { createCombinedAuthStyles } from '../combined-auth/styles';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthenticationProps {
  onLoginSuccess: (user: User) => void;
  currentState: 'login' | 'register';
  onStateChange: (state: 'login' | 'register') => void;
}

const Authentication: React.FC<AuthenticationProps> = ({
  onLoginSuccess,
  currentState,
  onStateChange
}) => {
  const { theme } = useTheme();
  const styles = createCombinedAuthStyles(theme);

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

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
      onLoginSuccess(mockUser);
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
      onLoginSuccess(mockUser);
      setLoading(false);
    }, 1500);
  };

  if (currentState === 'login') {
    return (
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
            onPress={() => onStateChange('register')}
          >
            <Text style={styles.secondaryButtonText}>
              Don't have an account? Sign Up
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
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
          onPress={() => onStateChange('login')}
        >
          <Text style={styles.secondaryButtonText}>
            Already have an account? Sign In
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Authentication;
export type { User };