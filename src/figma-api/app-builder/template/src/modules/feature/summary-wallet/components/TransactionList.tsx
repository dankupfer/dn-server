// src/modules/feature/summary-wallet/components/TransactionList.tsx
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme, Icon } from '@dankupfer/dn-components';

interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  date: string;
  icon: string;
  category: string;
}

interface TransactionListProps {
  transactions: Transaction[];
  onTransactionPress: (transaction: Transaction) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({ 
  transactions,
  onTransactionPress 
}) => {
  const { theme } = useTheme();

  // Helper to get token value from processed theme
  const getTokenValue = (tokenName: string): string | number => {
    return theme.tokens[tokenName] || 0;
  };

  const renderTransaction = (transaction: Transaction) => {
    const isNegative = transaction.amount < 0;
    
    return (
      <TouchableOpacity
        key={transaction.id}
        style={[
          styles.transactionItem,
          { 
            borderBottomColor: theme.colors.border.default,
            marginBottom: Number(getTokenValue('spacing_size_08')),
          }
        ]}
        onPress={() => onTransactionPress(transaction)}
        activeOpacity={0.7}
      >
        <View style={styles.transactionLeft}>
          {/* Icon */}
          <View style={[
            styles.transactionIcon,
            { backgroundColor: theme.colors.panel.background }
          ]}>
            <Icon name={transaction.icon} size={20} color={theme.colors.text.default} />
            {/* <Icon name={transaction.icon} size={20} color={theme.colors.text.default} /> */}
          </View>
          
          {/* Details */}
          <View style={styles.transactionDetails}>
            <Text style={[styles.merchantName, { color: theme.colors.text.default }]}>
              {transaction.merchant}
            </Text>
            <Text style={[styles.transactionDate, { color: theme.colors.text.subdued }]}>
              {transaction.date}
            </Text>
          </View>
        </View>

        {/* Amount and Arrow */}
        <View style={styles.transactionRight}>
          <Text style={[
            styles.transactionAmount, 
            { 
              color: isNegative ? theme.colors.text.default : '#22c55e' 
            }
          ]}>
            {isNegative ? '-' : '+'}£{Math.abs(transaction.amount).toFixed(2)}
          </Text>
          <Icon name="icons|cards|debit_card" size={16} color={theme.colors.text.subdued} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {transactions.map(renderTransaction)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 14,
  },
  transactionRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});

export default TransactionList;