// template/src/modules/feature/cards/index.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useTheme } from '@dankupfer/dn-components';
import { createCardsStyles } from './styles';

interface CardsProps {
  onLogout?: () => void;
  userData?: {
    name: string;
    greeting: string;
    notificationCount: number;
  };
}

const Cards: React.FC<CardsProps> = ({ onLogout, userData }) => {
  const { theme } = useTheme();
  const styles = createCardsStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationCount}>{userData?.notificationCount || 0}+</Text>
          </View>
          <Text style={styles.sectionTitle}>Cards</Text>
        </View>
        <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Manage Your Cards</Text>
          <Text style={styles.welcomeSubtitle}>
            Control your debit and credit cards from one place
          </Text>
        </View>

        {/* My Cards Section */}
        <View style={styles.cardsSection}>
          <Text style={styles.sectionHeading}>My Cards</Text>
          
          {/* Credit Card */}
          <View style={styles.cardContainer}>
            <View style={styles.cardVisual}>
              <Text style={styles.cardType}>Credit Card</Text>
              <Text style={styles.cardNumber}>**** **** **** 9053</Text>
              <Text style={styles.cardName}>JOHN DOE</Text>
              <Text style={styles.cardExpiry}>12/27</Text>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>View PIN</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Freeze Card</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Debit Card */}
          <View style={styles.cardContainer}>
            <View style={[styles.cardVisual, styles.debitCard]}>
              <Text style={styles.cardType}>Debit Card</Text>
              <Text style={styles.cardNumber}>**** **** **** 7160</Text>
              <Text style={styles.cardName}>JOHN DOE</Text>
              <Text style={styles.cardExpiry}>08/26</Text>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>View PIN</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Replace Card</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Card Services Section */}
        <View style={styles.servicesSection}>
          <Text style={styles.sectionHeading}>Card Services</Text>
          
          <TouchableOpacity style={styles.serviceItem}>
            <View style={styles.serviceIcon}>
              <Text style={styles.serviceIconText}>🔒</Text>
            </View>
            <View style={styles.serviceContent}>
              <Text style={styles.serviceTitle}>Card Security</Text>
              <Text style={styles.serviceDescription}>
                Manage card limits, notifications and security settings
              </Text>
            </View>
            <Text style={styles.serviceArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.serviceItem}>
            <View style={styles.serviceIcon}>
              <Text style={styles.serviceIconText}>📱</Text>
            </View>
            <View style={styles.serviceContent}>
              <Text style={styles.serviceTitle}>Digital Wallet</Text>
              <Text style={styles.serviceDescription}>
                Add your cards to Apple Pay, Google Pay and more
              </Text>
            </View>
            <Text style={styles.serviceArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.serviceItem}>
            <View style={styles.serviceIcon}>
              <Text style={styles.serviceIconText}>📊</Text>
            </View>
            <View style={styles.serviceContent}>
              <Text style={styles.serviceTitle}>Spending Analytics</Text>
              <Text style={styles.serviceDescription}>
                View your card spending patterns and insights
              </Text>
            </View>
            <Text style={styles.serviceArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.serviceItem}>
            <View style={styles.serviceIcon}>
              <Text style={styles.serviceIconText}>🎁</Text>
            </View>
            <View style={styles.serviceContent}>
              <Text style={styles.serviceTitle}>Rewards & Cashback</Text>
              <Text style={styles.serviceDescription}>
                Track your rewards and cashback earnings
              </Text>
            </View>
            <Text style={styles.serviceArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.serviceItem}>
            <View style={styles.serviceIcon}>
              <Text style={styles.serviceIconText}>📞</Text>
            </View>
            <View style={styles.serviceContent}>
              <Text style={styles.serviceTitle}>Report Lost/Stolen</Text>
              <Text style={styles.serviceDescription}>
                Quickly report and replace lost or stolen cards
              </Text>
            </View>
            <Text style={styles.serviceArrow}>→</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Cards;