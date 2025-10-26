// src/modules/features/account-overview/index.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { moduleLoader } from '../../../config/moduleLoader';

// Interface for account data
interface Account {
  id: string;
  name: string;
  balance: number;
  currency: string;
  accountNumber: string;
}

// Interface for transaction data
interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'credit' | 'debit';
}

// Module API implementation
const getAccounts = async (): Promise<Account[]> => {
  // Mock implementation
  return [
    {
      id: '1',
      name: 'Checking Account',
      balance: 123045.67,
      currency: 'USD',
      accountNumber: '****1235'
    },
    {
      id: '2',
      name: 'Savings Account',
      balance: 50000.00,
      currency: 'USD',
      accountNumber: '****5678'
    }
  ];
};

const getTransactions = async (accountId: string): Promise<Transaction[]> => {
  // Mock implementation
  return [
    {
      id: 't1',
      description: 'Grocery Store',
      amount: 45.32,
      date: '2023-10-15',
      type: 'debit'
    },
    {
      id: 't2',
      description: 'Direct Deposit',
      amount: 1250.00,
      date: '2023-10-14',
      type: 'credit'
    },
    {
      id: 't3',
      description: 'Coffee Shop',
      amount: 4.50,
      date: '2023-10-14',
      type: 'debit'
    }
  ];
};

// Module API object
const AccountOverviewAPI = {
  getAccounts,
  getTransactions
};

// UI Component
const AccountOverview = () => {
  // Get loaded modules to display
  const loadedModules = moduleLoader.getLoadedModules();
  console.log('Loaded modules:', loadedModules);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Banking Dashboard</Text>
        <Text style={styles.subtitle}>Welcome back, User</Text>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={styles.balanceAmount}>$12,345.67</Text>
        <Text style={styles.accountNumber}>Account **** 1234</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <View style={styles.actionButton}>
            <Text style={styles.actionText}>Transfer</Text>
          </View>
          <View style={styles.actionButton}>
            <Text style={styles.actionText}>Pay Bills</Text>
          </View>
          <View style={styles.actionButton}>
            <Text style={styles.actionText}>Deposit</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <View style={styles.transactionItem}>
          <Text style={styles.transactionName}>Grocery Store</Text>
          <Text style={styles.transactionAmount}>-$45.32</Text>
        </View>
        <View style={styles.transactionItem}>
          <Text style={styles.transactionName}>Direct Deposit</Text>
          <Text style={[styles.transactionAmount, styles.positive]}>+$1,250.00</Text>
        </View>
        <View style={styles.transactionItem}>
          <Text style={styles.transactionName}>Coffee Shop</Text>
          <Text style={styles.transactionAmount}>-$4.55</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Loaded Modules</Text>
        {loadedModules.map(moduleId => {
          const displayMeta = moduleLoader.getModuleDisplayMetadata(moduleId);
          if (!displayMeta) return null;
          
          return (
            <View key={moduleId} style={styles.moduleItem}>
              <Text style={styles.moduleName}>
                {displayMeta.name} v{displayMeta.version}
              </Text>
              <Text style={styles.moduleFeatures}>
                Features: {displayMeta.features.join(', ') || 'none'}
              </Text>
            </View>
          );
        })}
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
    backgroundColor: '#2ecc71',
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
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 8,
  },
  accountNumber: {
    fontSize: 12,
    color: '#999',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 8,
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
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  actionText: {
    fontWeight: '600',
    color: '#333',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionName: {
    fontSize: 16,
    color: '#333',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e74c3c',
  },
  positive: {
    color: '#2ecc71',
  },
  moduleItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  moduleName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  moduleFeatures: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});

// Module metadata (exports module info and API)
export const metadata = {
  name: 'Account Overview Dashboard',
  version: '1.5.0',
  features: ['account-management', 'transaction-history', 'dashboard', 'balance-overview'],
  api: AccountOverviewAPI
};

export default AccountOverview;