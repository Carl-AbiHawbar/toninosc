import { Alert, View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useApp, calculateOrderTotal } from '@/context/AppContext';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AppCard } from '@/components/AppCard';
import { StatusBadge } from '@/components/StatusBadge';
import { AppButton } from '@/components/AppButton';
import { OrderStatus } from '@/types';
import { spacing } from '@/theme/spacing';
import { formatCurrency, formatDate } from '@/utils/helpers';

const statusGroups: { label: string; statuses: OrderStatus[] }[] = [
  { label: 'Pending Approval', statuses: ['submitted'] },
  { label: 'Approved', statuses: ['approved'] },
  { label: 'Preparing', statuses: ['preparing'] },
  { label: 'Packed', statuses: ['packed'] },
  { label: 'Out for Delivery', statuses: ['out_for_delivery', 'assigned_to_driver'] },
];

const statusGroupLabelsAr: Record<string, string> = {
  'Pending Approval': 'بانتظار الموافقة',
  Approved: 'تمت الموافقة',
  Preparing: 'قيد التحضير',
  Packed: 'مغلّف',
  'Out for Delivery': 'خارج للتوصيل',
};

export default function WarehouseOrdersScreen() {
  const { orders, branches, stockItems, inventory, updateOrderStatus, language, themeColors, t } = useApp();

  const handleAction = async (orderId: string, status: OrderStatus) => {
    const result = await updateOrderStatus(orderId, status);
    if (!result.ok) {
      Alert.alert(
        language === 'ar' ? 'تعذر تحديث الطلب' : 'Could not update order',
        result.error ?? (language === 'ar' ? 'تحقق من المخزون وحاول مرة أخرى.' : 'Check available stock and try again.')
      );
    }
  };

  const handleEditQuantities = () => {
    Alert.alert(t('demoAction'), t('demoWarehouseEdit'));
  };

  const activeWarehouseOrders = orders.filter((o) =>
    ['submitted', 'approved', 'preparing', 'packed'].includes(o.status)
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader
          title={t('warehouseOrders')}
          subtitle={language === 'ar' ? 'الموافقة على الطلبات وتجهيزها' : 'Approve and prepare orders'}
        />

        {statusGroups.map((group) => {
          const groupOrders = orders.filter((o) => group.statuses.includes(o.status));
          if (groupOrders.length === 0) return null;

          return (
            <View key={group.label} style={styles.group}>
              <Text style={[styles.groupTitle, { color: themeColors.text }]}>
                {language === 'ar' ? statusGroupLabelsAr[group.label] : group.label} ({groupOrders.length})
              </Text>
              {groupOrders.map((order) => {
                const branch = branches.find((b) => b.id === order.branchId);
                return (
                  <AppCard key={order.id} style={styles.orderCard}>
                    <View style={styles.orderHeader}>
                      <View style={styles.orderHeaderText}>
                        <Text style={[styles.orderNum, { color: themeColors.text }]}>{order.orderNumber}</Text>
                        <Text style={[styles.branchName, { color: themeColors.primary }]}>{branch?.name}</Text>
                        <Text style={[styles.orderDate, { color: themeColors.textSecondary }]}>{formatDate(order.createdAt)}</Text>
                      </View>
                      <StatusBadge status={order.status} />
                    </View>

                    <Text style={[styles.pickLabel, { color: themeColors.textSecondary }]}>{t('pickList')}</Text>
                    {order.lines.map((line) => {
                      const stock = stockItems.find((item) => item.id === line.stockItemId);
                      const inv = inventory.find((balance) => balance.stockItemId === line.stockItemId);
                      const isLow = (inv?.currentStock ?? 0) < line.quantity;
                      return (
                        <View key={line.id} style={styles.pickRow}>
                          <View style={styles.pickItemWrap}>
                            <Text style={[styles.pickItem, { color: themeColors.text }]}>
                              {stock?.imageEmoji} {stock?.name}
                            </Text>
                            {(line.allocations?.length ?? 0) > 0 && (
                              <Text style={[styles.batchText, { color: themeColors.textSecondary }]}>
                                Batch: {line.allocations?.map((allocation) => `${allocation.batchNumber} x${allocation.quantity}`).join(', ')}
                              </Text>
                            )}
                          </View>
                          <Text style={[styles.pickQty, { color: themeColors.text }]}>x{line.quantity}</Text>
                          <Text style={[styles.pickStock, { color: isLow ? themeColors.error : themeColors.success }]}>
                            {t('leftCount', { count: inv?.currentStock ?? 0 })}
                          </Text>
                        </View>
                      );
                    })}

                    <Text style={[styles.orderTotal, { color: themeColors.primary }]}>
                      {t('total')}: {formatCurrency(calculateOrderTotal(order))}
                    </Text>

                    <View style={styles.actions}>
                      {order.status === 'submitted' && (
                        <>
                          <AppButton title={t('approve')} onPress={() => handleAction(order.id, 'approved')} variant="success" style={styles.actionBtn} textStyle={styles.actionText} />
                          <AppButton title={t('editQty')} onPress={handleEditQuantities} variant="outline" style={styles.actionBtn} textStyle={styles.actionText} />
                        </>
                      )}
                      {order.status === 'approved' && (
                        <AppButton title={t('markPreparing')} onPress={() => handleAction(order.id, 'preparing')} variant="warning" style={styles.actionBtn} />
                      )}
                      {order.status === 'preparing' && (
                        <AppButton title={t('markPacked')} onPress={() => handleAction(order.id, 'packed')} variant="secondary" style={styles.actionBtn} />
                      )}
                      {order.status === 'packed' && (
                        <AppButton
                          title={t('assignDriver')}
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

        {activeWarehouseOrders.length === 0 && (
          <Text style={[styles.empty, { color: themeColors.textSecondary }]}>{t('noPendingWarehouseOrders')}</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  group: { marginBottom: spacing.lg },
  groupTitle: { fontSize: 18, fontWeight: '700', marginBottom: spacing.sm },
  orderCard: { marginBottom: spacing.md },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm, marginBottom: spacing.sm },
  orderHeaderText: { flex: 1 },
  orderNum: { fontSize: 17, fontWeight: '800' },
  branchName: { fontSize: 15, fontWeight: '600' },
  orderDate: { fontSize: 13 },
  pickLabel: { fontSize: 14, fontWeight: '700', marginBottom: spacing.xs, marginTop: spacing.sm },
  pickRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, gap: spacing.sm },
  pickItemWrap: { flex: 1 },
  pickItem: { fontSize: 14 },
  batchText: { fontSize: 11, marginTop: 2 },
  pickQty: { fontSize: 14, fontWeight: '700', minWidth: 36 },
  pickStock: { fontSize: 12, fontWeight: '600', minWidth: 54, textAlign: 'right' },
  orderTotal: { fontSize: 16, fontWeight: '700', marginTop: spacing.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  actionBtn: { flex: 1, minWidth: '45%', minHeight: 44 },
  actionText: { fontSize: 14 },
  empty: { fontSize: 16, textAlign: 'center', marginTop: spacing.xl },
});
