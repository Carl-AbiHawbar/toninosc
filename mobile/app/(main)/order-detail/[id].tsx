import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useApp, calculateOrderTotal } from '@/context/AppContext';
import { mockBranches } from '@/data/mockBranches';
import { getStockItemById } from '@/data/mockStockItems';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AppCard } from '@/components/AppCard';
import { StatusBadge } from '@/components/StatusBadge';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { formatCurrency, formatDate } from '@/utils/helpers';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { orders } = useApp();

  const order = orders.find((o) => o.id === id);
  const branch = mockBranches.find((b) => b.id === order?.branchId);

  if (!order) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <ScreenHeader title="Order Not Found" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader title={order.orderNumber} subtitle={branch?.name} />

        <View style={styles.statusRow}>
          <StatusBadge status={order.status} />
          <Text style={styles.date}>{formatDate(order.createdAt)}</Text>
        </View>

        {order.lines.map((line) => {
          const stock = getStockItemById(line.stockItemId);
          return (
            <AppCard key={line.id} style={styles.lineCard}>
              <View style={styles.lineRow}>
                <Text style={styles.emoji}>{stock?.imageEmoji ?? '📦'}</Text>
                <View style={styles.lineInfo}>
                  <Text style={styles.lineName}>{stock?.name ?? 'Item'}</Text>
                  <Text style={styles.lineQty}>
                    {line.quantity} × {formatCurrency(line.unitPrice)}
                  </Text>
                  {line.note && <Text style={styles.note}>📝 {line.note}</Text>}
                </View>
                <Text style={styles.lineTotal}>
                  {formatCurrency(line.quantity * line.unitPrice)}
                </Text>
              </View>
            </AppCard>
          );
        })}

        {order.notes && (
          <AppCard style={styles.notesCard}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{order.notes}</Text>
          </AppCard>
        )}

        <AppCard style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatCurrency(calculateOrderTotal(order))}</Text>
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  date: { fontSize: 14, color: colors.textSecondary },
  lineCard: { marginBottom: spacing.sm },
  lineRow: { flexDirection: 'row', alignItems: 'center' },
  emoji: { fontSize: 28, marginRight: spacing.sm },
  lineInfo: { flex: 1 },
  lineName: { fontSize: 16, fontWeight: '700', color: colors.text },
  lineQty: { fontSize: 14, color: colors.textSecondary },
  note: { fontSize: 13, color: colors.warning, marginTop: 2 },
  lineTotal: { fontSize: 16, fontWeight: '700', color: colors.text },
  notesCard: { marginVertical: spacing.sm },
  notesLabel: { fontSize: 13, color: colors.textSecondary },
  notesText: { fontSize: 15, color: colors.text },
  totalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  totalLabel: { fontSize: 18, fontWeight: '700', color: colors.text },
  totalValue: { fontSize: 24, fontWeight: '800', color: colors.primary },
});
