import { useMemo, useState } from 'react';
import { Alert, View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { mockInventory } from '@/data/mockInventory';
import { mockStockItems, stockCategories } from '@/data/mockStockItems';
import { ScreenHeader } from '@/components/ScreenHeader';
import { CategoryFilter } from '@/components/CategoryFilter';
import { AppCard } from '@/components/AppCard';
import { AppButton } from '@/components/AppButton';
import { useApp } from '@/context/AppContext';
import { spacing } from '@/theme/spacing';
import { getInventoryStatusColor, getInventoryStatusLabel } from '@/utils/helpers';
import { inventoryFilterLabelsByLanguage, inventoryStatusLabelsByLanguage } from '@/i18n/translations';

const inventoryFilters = ['All', 'Low Stock', 'Critical', 'Expiring Soon'] as const;

export default function InventoryScreen() {
  const [filter, setFilter] = useState<string>('All');
  const [category, setCategory] = useState('All');
  const { language, themeColors, t } = useApp();
  const isArabic = language === 'ar';

  const showDemoMessage = (action: string) => {
    Alert.alert(t('demoAction'), t('demoInventory', { action }));
  };

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

  const reorderSuggestions = useMemo(() => {
    return mockInventory
      .map((inv) => {
        const stock = mockStockItems.find((s) => s.id === inv.stockItemId);
        if (!stock) return null;
        const targetStock = Math.max(inv.minimumStock * 2, inv.minimumStock + stock.averageOrderQty);
        const suggestedQty = Math.max(0, targetStock - inv.currentStock);
        return { inv, stock, suggestedQty };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item && item.suggestedQty > 0))
      .sort((a, b) => b.suggestedQty - a.suggestedQty)
      .slice(0, 5);
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader title={t('inventory')} subtitle={t('itemsCount', { count: items.length })} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {inventoryFilters.map((f) => (
            <AppButton
              key={f}
              title={inventoryFilterLabelsByLanguage[language][f]}
              onPress={() => setFilter(f)}
              variant={filter === f ? 'primary' : 'outline'}
              style={styles.filterBtn}
              textStyle={styles.filterText}
            />
          ))}
        </ScrollView>

        <CategoryFilter categories={stockCategories} selected={category} onSelect={setCategory} />

        {reorderSuggestions.length > 0 && (
          <AppCard style={styles.reorderCard}>
            <Text style={[styles.reorderTitle, { color: themeColors.text }, isArabic && styles.rtlText]}>
              {isArabic ? 'اقتراحات إعادة الطلب' : 'Reorder Suggestions'}
            </Text>
            {reorderSuggestions.map(({ stock, suggestedQty }) => (
              <View key={stock.id} style={styles.reorderRow}>
                <Text style={[styles.reorderItem, { color: themeColors.text }]}>{stock.name}</Text>
                <Text style={[styles.reorderQty, { color: themeColors.primary }]}>
                  {suggestedQty} {stock.unit}
                </Text>
              </View>
            ))}
          </AppCard>
        )}

        <View style={styles.actionRow}>
          <AppButton
            title={isArabic ? 'استلام مخزون' : 'Receive Stock'}
            onPress={() => showDemoMessage(isArabic ? 'استلام المخزون' : 'Receive Stock')}
            variant="success"
            style={styles.topBtn}
            textStyle={styles.topBtnText}
          />
          <AppButton
            title={isArabic ? 'تعديل مخزون' : 'Adjust Stock'}
            onPress={() => showDemoMessage(isArabic ? 'تعديل المخزون' : 'Adjust Stock')}
            variant="outline"
            style={styles.topBtn}
            textStyle={styles.topBtnText}
          />
          <AppButton
            title={isArabic ? 'حركة المخزون' : 'Movement History'}
            onPress={() => showDemoMessage(isArabic ? 'حركة المخزون' : 'Movement History')}
            variant="outline"
            style={styles.topBtn}
            textStyle={styles.topBtnText}
          />
        </View>

        {items.map(({ inv, stock }) => {
          if (!stock) return null;
          const statusColor = getInventoryStatusColor(inv.status, themeColors);

          return (
            <AppCard key={inv.id} style={styles.itemCard}>
              <View style={styles.itemRow}>
                <Text style={styles.emoji}>{stock.imageEmoji}</Text>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: themeColors.text }, isArabic && styles.rtlText]}>{stock.name}</Text>
                  <Text style={[styles.itemCategory, { color: themeColors.textSecondary }, isArabic && styles.rtlText]}>
                    {stock.category} · {stock.unit}
                  </Text>
                  <View style={styles.stockRow}>
                    <Text style={[styles.stockCurrent, { color: themeColors.text }]}>{inv.currentStock}</Text>
                    <Text style={[styles.stockMin, { color: themeColors.textSecondary }]}>
                      {' / '}
                      {isArabic ? 'الحد الأدنى' : 'min'} {inv.minimumStock}
                    </Text>
                  </View>
                  {inv.expiryDate && (
                    <Text style={[styles.expiry, { color: themeColors.warning }, isArabic && styles.rtlText]}>
                      {isArabic ? 'ينتهي:' : 'Expires:'} {inv.expiryDate}
                    </Text>
                  )}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20`, borderColor: statusColor }]}>
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {inventoryStatusLabelsByLanguage[language][inv.status] ?? getInventoryStatusLabel(inv.status)}
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
  safe: { flex: 1 },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  filterScroll: { marginBottom: spacing.sm, maxHeight: 50 },
  filterBtn: { marginRight: spacing.sm, minHeight: 40, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  filterText: { fontSize: 13 },
  actionRow: { gap: spacing.sm, marginBottom: spacing.md },
  reorderCard: { marginBottom: spacing.md },
  reorderTitle: { fontSize: 16, fontWeight: '800', marginBottom: spacing.sm },
  reorderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: 4,
  },
  reorderItem: { flex: 1, fontSize: 14, fontWeight: '600' },
  reorderQty: { fontSize: 14, fontWeight: '800' },
  topBtn: { minHeight: 44 },
  topBtnText: { fontSize: 14 },
  itemCard: { marginBottom: spacing.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  emoji: { fontSize: 36, marginRight: spacing.md },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '700' },
  itemCategory: { fontSize: 13 },
  stockRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  stockCurrent: { fontSize: 22, fontWeight: '800' },
  stockMin: { fontSize: 14 },
  expiry: { fontSize: 12, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: 108,
  },
  statusText: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
