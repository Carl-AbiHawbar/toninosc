import { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { mockInventory } from '@/data/mockInventory';
import { mockStockItems, stockCategories } from '@/data/mockStockItems';
import { ScreenHeader } from '@/components/ScreenHeader';
import { CategoryFilter } from '@/components/CategoryFilter';
import { AppCard } from '@/components/AppCard';
import { AppButton } from '@/components/AppButton';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { getInventoryStatusLabel, getInventoryStatusColor } from '@/utils/helpers';

const inventoryFilters = ['All', 'Low Stock', 'Critical', 'Expiring Soon'] as const;

export default function InventoryScreen() {
  const [filter, setFilter] = useState<string>('All');
  const [category, setCategory] = useState('All');

  const items = useMemo(() => {
    return mockInventory
      .map((inv) => {
        const stock = mockStockItems.find((s) => s.id === inv.stockItemId);
        return { inv, stock };
      })
      .filter(({ inv, stock }) => {
        if (!stock) return false;
        if (category !== 'All' && stock.category !== category) return false;
        if (filter === 'Low Stock') return inv.status === 'low';
        if (filter === 'Critical') return inv.status === 'critical';
        if (filter === 'Expiring Soon') return inv.status === 'expiring_soon';
        return true;
      });
  }, [filter, category]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader title="Inventory" subtitle={`${items.length} items`} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {inventoryFilters.map((f) => (
            <AppButton
              key={f}
              title={f}
              onPress={() => setFilter(f)}
              variant={filter === f ? 'primary' : 'outline'}
              style={styles.filterBtn}
              textStyle={styles.filterText}
            />
          ))}
        </ScrollView>

        <CategoryFilter
          categories={stockCategories}
          selected={category}
          onSelect={setCategory}
        />

        <View style={styles.actionRow}>
          <AppButton title="Receive Stock" onPress={() => {}} variant="success" style={styles.topBtn} textStyle={styles.topBtnText} />
          <AppButton title="Adjust Stock" onPress={() => {}} variant="outline" style={styles.topBtn} textStyle={styles.topBtnText} />
          <AppButton title="Movement History" onPress={() => {}} variant="outline" style={styles.topBtn} textStyle={styles.topBtnText} />
        </View>

        {items.map(({ inv, stock }) => {
          if (!stock) return null;
          const statusColor = getInventoryStatusColor(inv.status);

          return (
            <AppCard key={inv.id} style={styles.itemCard}>
              <View style={styles.itemRow}>
                <Text style={styles.emoji}>{stock.imageEmoji}</Text>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{stock.name}</Text>
                  <Text style={styles.itemCategory}>{stock.category} · {stock.unit}</Text>
                  <View style={styles.stockRow}>
                    <Text style={styles.stockCurrent}>{inv.currentStock}</Text>
                    <Text style={styles.stockMin}> / min {inv.minimumStock}</Text>
                  </View>
                  {inv.expiryDate && (
                    <Text style={styles.expiry}>Expires: {inv.expiryDate}</Text>
                  )}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {getInventoryStatusLabel(inv.status)}
                  </Text>
                </View>
              </View>
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
  filterScroll: { marginBottom: spacing.sm, maxHeight: 50 },
  filterBtn: { marginRight: spacing.sm, minHeight: 40, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  filterText: { fontSize: 13 },
  actionRow: { gap: spacing.sm, marginBottom: spacing.md },
  topBtn: { minHeight: 44 },
  topBtnText: { fontSize: 14 },
  itemCard: { marginBottom: spacing.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  emoji: { fontSize: 36, marginRight: spacing.md },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '700', color: colors.text },
  itemCategory: { fontSize: 13, color: colors.textSecondary },
  stockRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  stockCurrent: { fontSize: 22, fontWeight: '800', color: colors.text },
  stockMin: { fontSize: 14, color: colors.textSecondary },
  expiry: { fontSize: 12, color: colors.warning, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: { fontSize: 12, fontWeight: '700' },
});
