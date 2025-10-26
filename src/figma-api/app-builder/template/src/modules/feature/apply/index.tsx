// template/src/modules/feature/apply/index.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useTheme } from '@dankupfer/dn-components';
import { createApplyStyles } from './styles';

interface ApplyProps {
  onLogout?: () => void;
  userData?: {
    name: string;
    greeting: string;
    notificationCount: number;
  };
}

const Apply: React.FC<ApplyProps> = ({ onLogout, userData }) => {
  const { theme } = useTheme();
  const styles = createApplyStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationCount}>{userData?.notificationCount || 0}+</Text>
          </View>
          <Text style={styles.sectionTitle}>Apply</Text>
        </View>
        <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Apply for Banking Products</Text>
          <Text style={styles.welcomeSubtitle}>
            Choose from our range of banking products and services
          </Text>
        </View>

        {/* Application Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionHeading}>Account Applications</Text>
          
          <TouchableOpacity style={styles.applicationCard}>
            <View style={styles.cardIcon}>
              <Text style={styles.cardIconText}>💰</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Current Account</Text>
              <Text style={styles.cardDescription}>
                Open a new current account with overdraft facilities
              </Text>
            </View>
            <Text style={styles.cardArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.applicationCard}>
            <View style={styles.cardIcon}>
              <Text style={styles.cardIconText}>💳</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Savings Account</Text>
              <Text style={styles.cardDescription}>
                Start saving with competitive interest rates
              </Text>
            </View>
            <Text style={styles.cardArrow}>→</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.categoriesSection}>
          <Text style={styles.sectionHeading}>Credit Applications</Text>
          
          <TouchableOpacity style={styles.applicationCard}>
            <View style={styles.cardIcon}>
              <Text style={styles.cardIconText}>💎</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Credit Card</Text>
              <Text style={styles.cardDescription}>
                Apply for a credit card with cashback rewards
              </Text>
            </View>
            <Text style={styles.cardArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.applicationCard}>
            <View style={styles.cardIcon}>
              <Text style={styles.cardIconText}>🏠</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Personal Loan</Text>
              <Text style={styles.cardDescription}>
                Get funding for your personal projects
              </Text>
            </View>
            <Text style={styles.cardArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.applicationCard}>
            <View style={styles.cardIcon}>
              <Text style={styles.cardIconText}>🏡</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Mortgage</Text>
              <Text style={styles.cardDescription}>
                Finance your dream home with our mortgage products
              </Text>
            </View>
            <Text style={styles.cardArrow}>→</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.categoriesSection}>
          <Text style={styles.sectionHeading}>Investment Products</Text>
          
          <TouchableOpacity style={styles.applicationCard}>
            <View style={styles.cardIcon}>
              <Text style={styles.cardIconText}>📈</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Investment Account</Text>
              <Text style={styles.cardDescription}>
                Start investing with our managed portfolios
              </Text>
            </View>
            <Text style={styles.cardArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.applicationCard}>
            <View style={styles.cardIcon}>
              <Text style={styles.cardIconText}>🎯</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>ISA Account</Text>
              <Text style={styles.cardDescription}>
                Tax-efficient savings and investment options
              </Text>
            </View>
            <Text style={styles.cardArrow}>→</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Apply;