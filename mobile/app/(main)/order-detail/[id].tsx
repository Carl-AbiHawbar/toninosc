import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useApp, calculateOrderTotal } from '@/context/AppContext';
import { mockBranches } from '@/data/mockBranches';
import { mockUsers } from '@/data/mockUsers';
import { getStockItemById } from '@/data/mockStockItems';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AppCard } from '@/components/AppCard';
import { StatusBadge } from '@/components/StatusBadge';
import { spacing } from '@/theme/spacing';
import { formatCurrency, formatDate } from '@/utils/helpers';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { orders, auditEvents, language, themeColors, t } = useApp();
  const isArabic = language === 'ar';

  const order = orders.find((o) => o.id === id);
  const branch = mockBranches.find((b) => b.id === order?.branchId);
  const orderAuditEvents = auditEvents
    .filter((event) => event.entityType === 'order' && event.entityId === id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  if (!order) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
        <View style={styles.container}>
          <ScreenHeader title={isArabic ? 'الطلب غير موجود' : 'Order Not Found'} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader title={order.orderNumber} subtitle={branch?.name} />

        <View style={styles.statusRow}>
          <StatusBadge status={order.status} />
          <Text style={[styles.date, { color: themeColors.textSecondary }]}>
            {formatDate(order.createdAt)}
          </Text>
        </View>

        {order.lines.map((line) => {
          const stock = getStockItemById(line.stockItemId);
          return (
            <AppCard key={line.id} style={styles.lineCard}>
              <View style={styles.lineRow}>
                <Text style={styles.emoji}>{stock?.imageEmoji ?? 'Box'}</Text>
                <View style={styles.lineInfo}>
                  <Text style={[styles.lineName, { color: themeColors.text }]}>{stock?.name ?? (isArabic ? 'مادة' : 'Item')}</Text>
                  <Text style={[styles.lineQty, { color: themeColors.textSecondary }]}>
                    {line.quantity} x {formatCurrency(line.unitPrice)}
                  </Text>
                  {line.note && (
                    <Text style={[styles.note, { color: themeColors.warning }]}>{t('note')}: {line.note}</Text>
                  )}
                </View>
                <Text style={[styles.lineTotal, { color: themeColors.text }]}>
                  {formatCurrency(line.quantity * line.unitPrice)}
                </Text>
              </View>
            </AppCard>
          );
        })}

        {order.notes && (
          <AppCard style={styles.notesCard}>
            <Text style={[styles.notesLabel, { color: themeColors.textSecondary }]}>{t('orderNotes')}</Text>
            <Text style={[styles.notesText, { color: themeColors.text }]}>{order.notes}</Text>
          </AppCard>
        )}

        <AppCard style={styles.totalCard}>
          <Text style={[styles.totalLabel, { color: themeColors.text }]}>{t('total')}</Text>
          <Text style={[styles.totalValue, { color: themeColors.primary }]}>
            {formatCurrency(calculateOrderTotal(order))}
          </Text>
        </AppCard>

        <Text style={[styles.sectionTitle, { color: themeColors.text }, isArabic && styles.rtlText]}>
          {isArabic ? 'سجل الطلب' : 'Order History'}
        </Text>
        {orderAuditEvents.length === 0 ? (
          <AppCard>
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }, isArabic && styles.rtlText]}>
              {isArabic ? 'لا يوجد سجل بعد.' : 'No history yet.'}
            </Text>
          </AppCard>
        ) : (
          orderAuditEvents.map((event) => {
            const actor = mockUsers.find((user) => user.id === event.actorUserId);
            return (
              <AppCard key={event.id} style={styles.auditCard}>
                <Text style={[styles.auditAction, { color: themeColors.text }, isArabic && styles.rtlText]}>
                  {event.action}
                </Text>
                <Text style={[styles.auditMeta, { color: themeColors.textSecondary }, isArabic && styles.rtlText]}>
                  {formatDate(event.createdAt)} · {actor?.name ?? 'System'}
                </Text>
                {event.note && (
                  <Text style={[styles.auditNote, { color: themeColors.textSecondary }, isArabic && styles.rtlText]}>
                    {event.note}
                  </Text>
                )}
              </AppCard>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  date: { fontSize: 14 },
  lineCard: { marginBottom: spacing.sm },
  lineRow: { flexDirection: 'row', alignItems: 'center' },
  emoji: { fontSize: 28, marginRight: spacing.sm },
  lineInfo: { flex: 1 },
  lineName: { fontSize: 16, fontWeight: '700' },
  lineQty: { fontSize: 14 },
  note: { fontSize: 13, marginTop: 2 },
  lineTotal: { fontSize: 16, fontWeight: '700' },
  notesCard: { marginVertical: spacing.sm },
  notesLabel: { fontSize: 13 },
  notesText: { fontSize: 15 },
  totalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  totalLabel: { fontSize: 18, fontWeight: '700' },
  totalValue: { fontSize: 24, fontWeight: '800' },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginTop: spacing.lg, marginBottom: spacing.sm },
  auditCard: { marginBottom: spacing.sm },
  auditAction: { fontSize: 15, fontWeight: '800' },
  auditMeta: { fontSize: 12, marginTop: 3 },
  auditNote: { fontSize: 13, marginTop: spacing.xs, lineHeight: 18 },
  emptyText: { fontSize: 14, textAlign: 'center' },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
