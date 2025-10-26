// src/modules/features/payments/index.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

// Payment types
interface PaymentOption {
  id: string;
  name: string;
  description: string;
  icon: string;
}

// Mock payment API
const PaymentsAPI = {
  makePayment: async (type: string, amount: number, recipient: string) => {
    console.log(`Processing ${type} payment of $${amount} to ${recipient}`);
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, transactionId: Math.random().toString(36) });
      }, 1000);
    });
  },
  
  getPaymentHistory: async () => {
    // Mock payment history
    return [
      { id: 1, recipient: 'Electric Company', amount: 150.00, date: '2023-10-15', status: 'completed' },
      { id: 2, recipient: 'Water Utility', amount: 75.50, date: '2023-10-10', status: 'completed' },
      { id: 3, recipient: 'Internet Provider', amount: 89.99, date: '2023-10-05', status: 'pending' }
    ];
  }
};

const PaymentsScreen = () => {
  const paymentOptions: PaymentOption[] = [
    { id: 'transfer', name: 'Transfer Money', description: 'Send money to another account', icon: '💰' },
    { id: 'bills', name: 'Pay Bills', description: 'Pay your utilities and services', icon: '📄' },
    { id: 'mobile', name: 'Mobile Payments', description: 'Pay with your phone', icon: '📱' },
    { id: 'international', name: 'International Transfer', description: 'Send money abroad', icon: '🌍' }
  ];

  const handlePaymentOption = (option: PaymentOption) => {
    console.log(`Selected payment option: ${option.name}`);
    // Handle navigation to specific payment flow
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Payments</Text>
        <Text style={styles.subtitle}>Choose how you'd like to pay</Text>
      </View>

      <View style={styles.paymentOptions}>
        {paymentOptions.map((option) => (
          <TouchableOpacity 
            key={option.id} 
            style={styles.optionCard}
            onPress={() => handlePaymentOption(option)}
          >
            <Text style={styles.optionIcon}>{option.icon}</Text>
            <View style={styles.optionContent}>
              <Text style={styles.optionName}>{option.name}</Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.quickPaySection}>
        <Text style={styles.sectionTitle}>Quick Pay</Text>
        <View style={styles.quickPayGrid}>
          <TouchableOpacity style={styles.quickPayButton}>
            <Text style={styles.quickPayAmount}>$50</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickPayButton}>
            <Text style={styles.quickPayAmount}>$100</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickPayButton}>
            <Text style={styles.quickPayAmount}>$200</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickPayButton}>
            <Text style={styles.quickPayAmount}>Custom</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#3498db',
    padding: 24,
    paddingTop: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginTop: 8,
  },
  paymentOptions: {
    padding: 16,
  },
  optionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  optionDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  arrow: {
    fontSize: 20,
    color: '#999',
  },
  quickPaySection: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  quickPayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickPayButton: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickPayAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3498db',
  },
});

// Module metadata
export const metadata = {
  name: 'Payments & Transfers',
  version: '1.2.0',
  features: ['money-transfer', 'bill-payment', 'mobile-payment', 'international-transfer', 'quick-pay'],
  api: PaymentsAPI
};

export default PaymentsScreen;