import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp, calculateOrderTotal } from '@/context/AppContext';
import { mockBranches } from '@/data/mockBranches';
import { getOrderItemCount } from '@/data/mockOrders';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AppCard } from '@/components/AppCard';
import { StatusBadge } from '@/components/StatusBadge';
import { AppButton } from '@/components/AppButton';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { formatCurrency, formatDate } from '@/utils/helpers';

export default function AdminOrdersScreen() {
  const router = useRouter();
  const { orders } = useApp();

  const sorted = [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader title="All Branch Orders" subtitle={`${sorted.length} total`} />

        {sorted.map((order) => {
          const branch = mockBranches.find((b) => b.id === order.branchId);
          return (
            <AppCard key={order.id} style={styles.card}>
              <View style={styles.header}>
                <View>
                  <Text style={styles.orderNum}>{order.orderNumber}</Text>
                  <Text style={styles.branch}>{branch?.name}</Text>
                  <Text style={styles.date}>{formatDate(order.createdAt)}</Text>
                </View>
                <StatusBadge status={order.status} />
              </View>
              <View style={styles.meta}>
                <Text style={styles.items}>{getOrderItemCount(order)} items</Text>
                <Text style={styles.total}>{formatCurrency(calculateOrderTotal(order))}</Text>
              </View>
              <AppButton
                title="View Details"
                onPress={() => router.push(`/(main)/order-detail/${order.id}`)}
                variant="outline"
                style={styles.btn}
                textStyle={styles.btnText}
              />
            </AppCard>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: { marginBottom: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  orderNum: { fontSize: 17, fontWeight: '800', color: colors.text },
  branch: { fontSize: 15, color: colors.primary, fontWeight: '600' },
  date: { fontSize: 13, color: colors.textSecondary },
  meta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  items: { fontSize: 14, color: colors.textSecondary },
  total: { fontSize: 17, fontWeight: '700', color: colors.primary },
  btn: { minHeight: 44 },
  btnText: { fontSize: 14 },
});
