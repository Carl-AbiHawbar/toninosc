import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useApp, calculateOrderTotal } from '@/context/AppContext';
import { mockBranches } from '@/data/mockBranches';
import { getStockItemById } from '@/data/mockStockItems';
import { getInventoryForItem } from '@/data/mockInventory';
import { mockUsers } from '@/data/mockUsers';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AppCard } from '@/components/AppCard';
import { StatusBadge } from '@/components/StatusBadge';
import { AppButton } from '@/components/AppButton';
import { OrderStatus } from '@/types';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { formatCurrency, formatDate } from '@/utils/helpers';

const statusGroups: { label: string; statuses: OrderStatus[] }[] = [
  { label: 'Pending Approval', statuses: ['submitted'] },
  { label: 'Approved', statuses: ['approved'] },
  { label: 'Preparing', statuses: ['preparing'] },
  { label: 'Packed', statuses: ['packed'] },
  { label: 'Out for Delivery', statuses: ['out_for_delivery', 'assigned_to_driver'] },
];

export default function WarehouseOrdersScreen() {
  const { orders, updateOrderStatus } = useApp();

  const handleAction = (orderId: string, status: OrderStatus) => {
    updateOrderStatus(orderId, status);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader title="Warehouse Orders" subtitle="Approve and prepare orders" />

        {statusGroups.map((group) => {
          const groupOrders = orders.filter((o) => group.statuses.includes(o.status));
          if (groupOrders.length === 0) return null;

          return (
            <View key={group.label} style={styles.group}>
              <Text style={styles.groupTitle}>{group.label} ({groupOrders.length})</Text>
              {groupOrders.map((order) => {
                const branch = mockBranches.find((b) => b.id === order.branchId);
                return (
                  <AppCard key={order.id} style={styles.orderCard}>
                    <View style={styles.orderHeader}>
                      <View>
                        <Text style={styles.orderNum}>{order.orderNumber}</Text>
                        <Text style={styles.branchName}>{branch?.name}</Text>
                        <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
                      </View>
                      <StatusBadge status={order.status} />
                    </View>

                    <Text style={styles.pickLabel}>Pick List</Text>
                    {order.lines.map((line) => {
                      const stock = getStockItemById(line.stockItemId);
                      const inv = getInventoryForItem(line.stockItemId);
                      return (
                        <View key={line.id} style={styles.pickRow}>
                          <Text style={styles.pickItem}>
                            {stock?.imageEmoji} {stock?.name}
                          </Text>
                          <Text style={styles.pickQty}>×{line.quantity}</Text>
                          <Text style={[
                            styles.pickStock,
                            (inv?.currentStock ?? 0) < line.quantity && styles.pickStockLow,
                          ]}>
                            {inv?.currentStock ?? 0} left
                          </Text>
                        </View>
                      );
                    })}

                    <Text style={styles.orderTotal}>
                      Total: {formatCurrency(calculateOrderTotal(order))}
                    </Text>

                    <View style={styles.actions}>
                      {order.status === 'submitted' && (
                        <>
                          <AppButton title="Approve" onPress={() => handleAction(order.id, 'approved')} variant="success" style={styles.actionBtn} textStyle={styles.actionText} />
                          <AppButton title="Edit Qty" onPress={() => {}} variant="outline" style={styles.actionBtn} textStyle={styles.actionText} />
                        </>
                      )}
                      {order.status === 'approved' && (
                        <AppButton title="Mark Preparing" onPress={() => handleAction(order.id, 'preparing')} variant="warning" style={styles.actionBtn} />
                      )}
                      {order.status === 'preparing' && (
                        <AppButton title="Mark Packed" onPress={() => handleAction(order.id, 'packed')} variant="secondary" style={styles.actionBtn} />
                      )}
                      {order.status === 'packed' && (
                        <AppButton
                          title="Assign Driver"
                          onPress={() => {
                            handleAction(order.id, 'assigned_to_driver');
                            handleAction(order.id, 'out_for_delivery');
                          }}
                          style={styles.actionBtn}
                        />
                      )}
                    </View>
                  </AppCard>
                );
              })}
            </View>
          );
        })}

        {orders.filter((o) => ['submitted', 'approved', 'preparing', 'packed'].includes(o.status)).length === 0 && (
          <Text style={styles.empty}>No pending warehouse orders.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  group: { marginBottom: spacing.lg },
  groupTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  orderCard: { marginBottom: spacing.md },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  orderNum: { fontSize: 17, fontWeight: '800', color: colors.text },
  branchName: { fontSize: 15, color: colors.primary, fontWeight: '600' },
  orderDate: { fontSize: 13, color: colors.textSecondary },
  pickLabel: { fontSize: 14, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.sm },
  pickRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  pickItem: { flex: 1, fontSize: 14, color: colors.text },
  pickQty: { fontSize: 14, fontWeight: '700', color: colors.text, marginRight: spacing.sm, minWidth: 36 },
  pickStock: { fontSize: 12, color: colors.success, fontWeight: '600' },
  pickStockLow: { color: colors.error },
  orderTotal: { fontSize: 16, fontWeight: '700', color: colors.primary, marginTop: spacing.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  actionBtn: { flex: 1, minWidth: '45%', minHeight: 44 },
  actionText: { fontSize: 14 },
  empty: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl },
});
