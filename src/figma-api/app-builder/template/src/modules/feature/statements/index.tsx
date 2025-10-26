// src/modules/features/statements/index.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

// Statement types
interface Statement {
  id: string;
  date: string;
  description: string;
  amount: number;
  balance: number;
  type: 'credit' | 'debit';
}

interface StatementPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

// Mock statements API
const StatementsAPI = {
  getStatements: async (periodId?: string) => {
    // Mock implementation - return different statements based on period
    const baseStatements: Statement[] = [
      {
        id: 's1',
        date: '2023-10-15',
        description: 'Salary Deposit',
        amount: 3500.00,
        balance: 15850.00,
        type: 'credit'
      },
      {
        id: 's2',
        date: '2023-10-14',
        description: 'Grocery Store',
        amount: 125.50,
        balance: 12350.00,
        type: 'debit'
      },
      {
        id: 's3',
        date: '2023-10-13',
        description: 'Electric Bill Payment',
        amount: 150.00,
        balance: 12475.50,
        type: 'debit'
      },
      {
        id: 's4',
        date: '2023-10-12',
        description: 'Restaurant',
        amount: 75.20,
        balance: 12625.50,
        type: 'debit'
      },
      {
        id: 's5',
        date: '2023-10-11',
        description: 'Cash Deposit',
        amount: 500.00,
        balance: 12700.70,
        type: 'credit'
      }
    ];

    return baseStatements;
  },
  
  getStatementPeriods: async () => {
    return [
      { id: 'current', name: 'Current Month', startDate: '2023-10-01', endDate: '2023-10-31' },
      { id: 'last', name: 'Last Month', startDate: '2023-09-01', endDate: '2023-09-30' },
      { id: '3months', name: 'Last 3 Months', startDate: '2023-07-01', endDate: '2023-09-30' },
      { id: 'custom', name: 'Custom Range', startDate: '', endDate: '' }
    ];
  },
  
  downloadStatement: async (periodId: string, format: 'pdf' | 'csv') => {
    console.log(`Downloading ${format} statement for period ${periodId}`);
    return { success: true, downloadUrl: 'mock-url' };
  }
};

const StatementsScreen = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current');
  const [statements] = useState<Statement[]>([
    {
      id: 's1',
      date: '2023-10-15',
      description: 'Salary Deposit',
      amount: 3500.00,
      balance: 15850.00,
      type: 'credit'
    },
    {
      id: 's2',
      date: '2023-10-14',
      description: 'Grocery Store',
      amount: 125.50,
      balance: 12350.00,
      type: 'debit'
    },
    {
      id: 's3',
      date: '2023-10-13',
      description: 'Electric Bill Payment',
      amount: 150.00,
      balance: 12475.50,
      type: 'debit'
    },
    {
      id: 's4',
      date: '2023-10-12',
      description: 'Restaurant',
      amount: 75.20,
      balance: 12625.50,
      type: 'debit'
    },
    {
      id: 's5',
      date: '2023-10-11',
      description: 'Cash Deposit',
      amount: 500.00,
      balance: 12700.70,
      type: 'credit'
    }
  ]);

  const periods: StatementPeriod[] = [
    { id: 'current', name: 'Current Month', startDate: '2023-10-01', endDate: '2023-10-31' },
    { id: 'last', name: 'Last Month', startDate: '2023-09-01', endDate: '2023-09-30' },
    { id: '3months', name: 'Last 3 Months', startDate: '2023-07-01', endDate: '2023-09-30' },
    { id: 'custom', name: 'Custom Range', startDate: '', endDate: '' }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Statements</Text>
        <Text style={styles.subtitle}>View your transaction history</Text>
      </View>

      <View style={styles.periodSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.id}
              style={[
                styles.periodButton,
                selectedPeriod === period.id && styles.selectedPeriodButton
              ]}
              onPress={() => setSelectedPeriod(period.id)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period.id && styles.selectedPeriodButtonText
              ]}>
                {period.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.downloadSection}>
        <TouchableOpacity style={styles.downloadButton}>
          <Text style={styles.downloadButtonText}>Download PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.downloadButton}>
          <Text style={styles.downloadButtonText}>Download CSV</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statementsContainer}>
        {statements.map((statement) => (
          <View key={statement.id} style={styles.statementItem}>
            <View style={styles.statementInfo}>
              <Text style={styles.statementDate}>{formatDate(statement.date)}</Text>
              <Text style={styles.statementDescription}>{statement.description}</Text>
            </View>
            <View style={styles.statementAmounts}>
              <Text style={[
                styles.statementAmount,
                statement.type === 'credit' ? styles.creditAmount : styles.debitAmount
              ]}>
                {statement.type === 'credit' ? '+' : '-'}{formatCurrency(statement.amount)}
              </Text>
              <Text style={styles.statementBalance}>Balance: {formatCurrency(statement.balance)}</Text>
            </View>
          </View>
        ))}
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
    backgroundColor: '#9b59b6',
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
  periodSelector: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
  },
  periodButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  selectedPeriodButton: {
    backgroundColor: '#9b59b6',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedPeriodButtonText: {
    color: '#fff',
  },
  downloadSection: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  downloadButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  downloadButtonText: {
    fontSize: 14,
    color: '#9b59b6',
    fontWeight: '600',
  },
  statementsContainer: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statementItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statementInfo: {
    flex: 1,
  },
  statementDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  statementDescription: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  statementAmounts: {
    alignItems: 'flex-end',
  },
  statementAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  creditAmount: {
    color: '#2ecc71',
  },
  debitAmount: {
    color: '#e74c3c',
  },
  statementBalance: {
    fontSize: 12,
    color: '#999',
  },
});

// Module metadata
export const metadata = {
  name: 'Account Statements',
  version: '1.1.0',
  features: ['transaction-history', 'statement-download', 'period-selection', 'balance-tracking'],
  api: StatementsAPI
};

export default StatementsScreen;