import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp, calculateOrderTotal } from '@/context/AppContext';
import { getOrderItemCount } from '@/data/mockOrders';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AppCard } from '@/components/AppCard';
import { StatusBadge } from '@/components/StatusBadge';
import { AppButton } from '@/components/AppButton';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { formatCurrency, formatDate } from '@/utils/helpers';

export default function MyOrdersScreen() {
  const router = useRouter();
  const { currentUser, orders } = useApp();

  const myOrders = orders
    .filter((o) => o.branchId === currentUser?.branchId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader title="My Orders" subtitle={`${myOrders.length} orders`} />

        {myOrders.length === 0 ? (
          <Text style={styles.empty}>No orders yet. Create your first order!</Text>
        ) : (
          myOrders.map((order) => (
            <AppCard key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderNum}>{order.orderNumber}</Text>
                <StatusBadge status={order.status} />
              </View>
              <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
              <View style={styles.orderMeta}>
                <Text style={styles.metaText}>{getOrderItemCount(order)} items</Text>
                <Text style={styles.metaTotal}>{formatCurrency(calculateOrderTotal(order))}</Text>
              </View>
              <AppButton
                title="View Details"
                onPress={() => router.push(`/(main)/order-detail/${order.id}`)}
                variant="outline"
                style={styles.viewBtn}
                textStyle={styles.viewBtnText}
              />
            </AppCard>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  empty: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  orderCard: {
    marginBottom: spacing.md,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  orderNum: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  orderDate: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  orderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  metaText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  metaTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  viewBtn: {
    minHeight: 44,
  },
  viewBtnText: {
    fontSize: 15,
  },
});
