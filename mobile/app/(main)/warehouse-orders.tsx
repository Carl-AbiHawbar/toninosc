import { useState } from 'react';
import { Alert, View, Text, ScrollView, StyleSheet, SafeAreaView, Modal, TextInput, TouchableOpacity } from 'react-native';
import { useApp, calculateOrderTotal } from '@/context/AppContext';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AppCard } from '@/components/AppCard';
import { StatusBadge } from '@/components/StatusBadge';
import { AppButton } from '@/components/AppButton';
import { OrderStatus } from '@/types';
import { spacing } from '@/theme/spacing';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { getStockItemName } from '@/utils/stockLocalization';

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
  const {
    orders,
    branches,
    stockItems,
    inventory,
    users,
    deliveries,
    updateOrderStatus,
    updateOrderLineQuantity,
    assignOrderToDriver,
    language,
    themeColors,
    t,
  } = useApp();
  const [lineEditor, setLineEditor] = useState<{
    orderId: string;
    lineId: string;
    itemName: string;
    quantity: string;
    note: string;
  } | null>(null);
  const [driverPicker, setDriverPicker] = useState<{ orderId: string } | null>(null);
  const [assigningDriverId, setAssigningDriverId] = useState<string | null>(null);
  const drivers = users.filter((user) => user.role === 'driver' && user.active !== false);

  const handleAction = async (orderId: string, status: OrderStatus) => {
    const result = await updateOrderStatus(orderId, status);
    if (!result.ok) {
      Alert.alert(
        language === 'ar' ? 'تعذر تحديث الطلب' : 'Could not update order',
        result.error ?? (language === 'ar' ? 'تحقق من المخزون وحاول مرة أخرى.' : 'Check available stock and try again.')
      );
    }
  };

  const saveLineQuantity = async () => {
    if (!lineEditor) return;
    const quantity = Number(lineEditor.quantity.replace(',', '.'));
    if (!Number.isFinite(quantity) || quantity <= 0) {
      Alert.alert(language === 'ar' ? 'Invalid quantity' : 'Invalid quantity', language === 'ar' ? 'Enter a quantity greater than zero.' : 'Enter a quantity greater than zero.');
      return;
    }
    if (!lineEditor.note.trim()) {
      Alert.alert(language === 'ar' ? 'Note required' : 'Note required', language === 'ar' ? 'Add a note so the branch knows why it changed.' : 'Add a note so the branch knows why it changed.');
      return;
    }

    const result = await updateOrderLineQuantity(lineEditor.lineId, quantity, lineEditor.note.trim());
    if (!result.ok) {
      Alert.alert(language === 'ar' ? 'Could not edit quantity' : 'Could not edit quantity', result.error ?? 'Try again.');
      return;
    }
    setLineEditor(null);
  };

  const activeWarehouseOrders = orders.filter((o) =>
    ['submitted', 'approved', 'preparing', 'packed', 'assigned_to_driver', 'out_for_delivery'].includes(o.status)
  );

  const getAssignedDriver = (orderId: string) => {
    const delivery = deliveries.find((item) => item.stops.some((stop) => stop.orderId === orderId));
    return delivery ? users.find((user) => user.id === delivery.driverId) : undefined;
  };

  const handleAssignDriver = async (driverUserId: string) => {
    if (!driverPicker) return;
    setAssigningDriverId(driverUserId);
    const result = await assignOrderToDriver(driverPicker.orderId, driverUserId);
    setAssigningDriverId(null);

    if (!result.ok) {
      Alert.alert(
        language === 'ar' ? 'Could not assign driver' : 'Could not assign driver',
        result.error ?? (language === 'ar' ? 'Try again.' : 'Try again.')
      );
      return;
    }

    setDriverPicker(null);
  };

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
                const assignedDriver = getAssignedDriver(order.id);
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
                      const itemName = getStockItemName(stock, language);
                      return (
                        <View key={line.id} style={styles.pickRow}>
                          <View style={styles.pickItemWrap}>
                            <Text style={[styles.pickItem, { color: themeColors.text }]}>
                              {stock?.imageEmoji} {itemName}
                            </Text>
                            {(line.allocations?.length ?? 0) > 0 && (
                              <Text style={[styles.batchText, { color: themeColors.textSecondary }]}>
                                Batch: {line.allocations?.map((allocation) => `${allocation.batchNumber} x${allocation.quantity}`).join(', ')}
                              </Text>
                            )}
                            {line.note && (
                              <Text style={[styles.batchText, { color: themeColors.warning }]}>
                                Note: {line.note}
                              </Text>
                            )}
                          </View>
                          <Text style={[styles.pickQty, { color: themeColors.text }]}>x{line.quantity}</Text>
                          <Text style={[styles.pickStock, { color: isLow ? themeColors.error : themeColors.success }]}>
                            {t('leftCount', { count: inv?.currentStock ?? 0 })}
                          </Text>
                          {order.status === 'submitted' && (
                            <TouchableOpacity
                              style={[styles.lineEditButton, { borderColor: themeColors.border }]}
                              onPress={() =>
                                setLineEditor({
                                  orderId: order.id,
                                  lineId: line.id,
                                  itemName,
                                  quantity: String(line.quantity),
                                  note: line.note ?? '',
                                })
                              }
                            >
                              <Text style={[styles.lineEditText, { color: themeColors.primary }]}>Edit</Text>
                            </TouchableOpacity>
                          )}
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
                          <AppButton
                            title={t('editQty')}
                            onPress={() => {
                              const firstLine = order.lines[0];
                              const stock = stockItems.find((item) => item.id === firstLine?.stockItemId);
                              if (!firstLine) return;
                              setLineEditor({
                                orderId: order.id,
                                lineId: firstLine.id,
                                itemName: getStockItemName(stock, language),
                                quantity: String(firstLine.quantity),
                                note: firstLine.note ?? '',
                              });
                            }}
                            variant="outline"
                            style={styles.actionBtn}
                            textStyle={styles.actionText}
                          />
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
                          title={assignedDriver ? `${t('assignDriver')}: ${assignedDriver.name}` : t('assignDriver')}
                          onPress={() => setDriverPicker({ orderId: order.id })}
                          style={styles.actionBtn}
                        />
                      )}
                      {['assigned_to_driver', 'out_for_delivery'].includes(order.status) && (
                        <AppButton
                          title={assignedDriver ? `${t('assignDriver')}: ${assignedDriver.name}` : t('assignDriver')}
                          onPress={() => setDriverPicker({ orderId: order.id })}
                          variant="outline"
                          style={styles.actionBtn}
                          textStyle={styles.actionText}
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

      <Modal visible={!!lineEditor} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: themeColors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>
              {language === 'ar' ? 'Edit quantity' : 'Edit quantity'}
            </Text>
            <Text style={[styles.modalSubtitle, { color: themeColors.textSecondary }]}>
              {lineEditor?.itemName}
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: themeColors.background, borderColor: themeColors.borderStrong, color: themeColors.text }]}
              value={lineEditor?.quantity ?? ''}
              onChangeText={(value) => setLineEditor((prev) => (prev ? { ...prev, quantity: value } : prev))}
              keyboardType="decimal-pad"
              placeholder="Quantity"
              placeholderTextColor={themeColors.textSecondary}
            />
            <TextInput
              style={[styles.input, styles.noteInput, { backgroundColor: themeColors.background, borderColor: themeColors.borderStrong, color: themeColors.text }]}
              value={lineEditor?.note ?? ''}
              onChangeText={(value) => setLineEditor((prev) => (prev ? { ...prev, note: value } : prev))}
              placeholder={language === 'ar' ? 'Reason shown to branch manager' : 'Reason shown to branch manager'}
              placeholderTextColor={themeColors.textSecondary}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setLineEditor(null)}>
                <Text style={[styles.cancelText, { color: themeColors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <AppButton title="Save" onPress={saveLineQuantity} style={styles.saveButton} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!driverPicker} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: themeColors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>
              {language === 'ar' ? 'Choose driver' : 'Choose driver'}
            </Text>
            <Text style={[styles.modalSubtitle, { color: themeColors.textSecondary }]}>
              {language === 'ar' ? 'The order will appear in the selected driver route for today.' : 'The order will appear in the selected driver route for today.'}
            </Text>
            {drivers.length === 0 ? (
              <Text style={[styles.empty, { color: themeColors.textSecondary }]}>
                {language === 'ar' ? 'No drivers found.' : 'No drivers found.'}
              </Text>
            ) : (
              drivers.map((driver) => (
                <AppButton
                  key={driver.id}
                  title={driver.name}
                  onPress={() => handleAssignDriver(driver.id)}
                  loading={assigningDriverId === driver.id}
                  disabled={Boolean(assigningDriverId)}
                  variant="outline"
                  style={styles.driverButton}
                />
              ))
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setDriverPicker(null)} disabled={Boolean(assigningDriverId)}>
                <Text style={[styles.cancelText, { color: themeColors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  lineEditButton: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  lineEditText: { fontSize: 11, fontWeight: '800' },
  orderTotal: { fontSize: 16, fontWeight: '700', marginTop: spacing.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  actionBtn: { flex: 1, minWidth: '45%', minHeight: 44 },
  actionText: { fontSize: 14 },
  empty: { fontSize: 16, textAlign: 'center', marginTop: spacing.xl },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: spacing.lg },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  modalSubtitle: { fontSize: 14, marginTop: 2, marginBottom: spacing.md },
  input: { borderWidth: 1, borderRadius: 8, minHeight: 46, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  noteInput: { minHeight: 84, paddingTop: spacing.sm, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  cancelText: { fontSize: 16, fontWeight: '700', padding: spacing.sm },
  saveButton: { minWidth: 120 },
  driverButton: { minHeight: 44, marginBottom: spacing.sm },
});
