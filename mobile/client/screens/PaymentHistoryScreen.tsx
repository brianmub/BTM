import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/Card';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { storage, PaymentRecord, Program } from '@/lib/storage';

interface PaymentWithProgram extends PaymentRecord {
  programName: string;
}

export default function PaymentHistoryScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentWithProgram[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [totalPaid, setTotalPaid] = useState(0);

  const loadData = async () => {
    if (!user) return;

    const [allPayments, programs] = await Promise.all([
      storage.getUserPayments(user.id),
      storage.getPrograms(),
    ]);

    const paymentsWithProgram = allPayments.map(p => ({
      ...p,
      programName: programs.find(pr => pr.id === p.programId)?.name || 'Unknown Program',
    }));

    setPayments(paymentsWithProgram.sort((a, b) => 
      new Date(b.confirmedAt || b.id).getTime() - new Date(a.confirmedAt || a.id).getTime()
    ));

    const total = allPayments
      .filter(p => p.isPaid)
      .reduce((sum, p) => sum + p.amount, 0);
    setTotalPaid(total);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Pending';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderPayment = ({ item, index }: { item: PaymentWithProgram; index: number }) => (
    <Animated.View entering={FadeInUp.delay(index * 50).duration(400)}>
      <Card elevation={1} style={styles.paymentCard}>
        <View style={styles.paymentHeader}>
          <View style={[styles.iconContainer, { backgroundColor: item.isPaid ? theme.success + '20' : theme.warning + '20' }]}>
            <Feather
              name={item.isPaid ? 'check-circle' : 'clock'}
              size={20}
              color={item.isPaid ? theme.success : theme.warning}
            />
          </View>
          <View style={styles.paymentInfo}>
            <ThemedText type="body" style={{ fontWeight: '600' }}>
              {item.programName}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {formatDate(item.confirmedAt)}
            </ThemedText>
          </View>
          <View style={styles.amountContainer}>
            <ThemedText type="h4" style={{ color: item.isPaid ? theme.success : theme.text }}>
              ${item.amount.toFixed(2)}
            </ThemedText>
            <View style={[styles.statusBadge, { backgroundColor: item.isPaid ? theme.success + '20' : theme.warning + '20' }]}>
              <ThemedText
                type="small"
                style={{ color: item.isPaid ? theme.success : theme.warning, fontWeight: '600' }}
              >
                {item.isPaid ? 'Paid' : 'Pending'}
              </ThemedText>
            </View>
          </View>
        </View>
      </Card>
    </Animated.View>
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={payments}
        keyExtractor={item => item.id}
        renderItem={renderPayment}
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + 100 },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.link} />
        }
        ListHeaderComponent={
          <Animated.View entering={FadeInUp.duration(400)}>
            <Card elevation={1} style={styles.summaryCard}>
              <View style={[styles.summaryIcon, { backgroundColor: theme.primary + '20' }]}>
                <Feather name="credit-card" size={28} color={theme.primary} />
              </View>
              <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
                Total Paid
              </ThemedText>
              <ThemedText type="h1" style={{ marginTop: Spacing.xs }}>
                ${totalPaid.toFixed(2)}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
                {payments.filter(p => p.isPaid).length} payment{payments.filter(p => p.isPaid).length !== 1 ? 's' : ''} recorded
              </ThemedText>
            </Card>
            {payments.length > 0 ? (
              <ThemedText type="h4" style={styles.sectionTitle}>
                Payment History
              </ThemedText>
            ) : null}
          </Animated.View>
        }
        ListEmptyComponent={
          <Card elevation={1} style={styles.emptyCard}>
            <Feather name="inbox" size={48} color={theme.textSecondary} />
            <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.md, textAlign: 'center' }}>
              No payment records yet
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs, textAlign: 'center' }}>
              Your payment history will appear here
            </ThemedText>
          </Card>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
  },
  summaryCard: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    marginBottom: Spacing.xl,
  },
  summaryIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  paymentCard: {
    marginBottom: Spacing.md,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  paymentInfo: {
    flex: 1,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
});
