import { useMemo, useState } from 'react';
import { Alert, View, Text, ScrollView, StyleSheet, SafeAreaView, Modal, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { stockCategories } from '@/data/mockStockItems';
import { ScreenHeader } from '@/components/ScreenHeader';
import { CategoryFilter } from '@/components/CategoryFilter';
import { AppCard } from '@/components/AppCard';
import { AppButton } from '@/components/AppButton';
import { useApp } from '@/context/AppContext';
import { borderRadius, spacing } from '@/theme/spacing';
import { formatCurrency, getInventoryStatusColor, getInventoryStatusLabel } from '@/utils/helpers';
import { inventoryFilterLabelsByLanguage, inventoryStatusLabelsByLanguage } from '@/i18n/translations';
import { StockCategory, StockItem } from '@/types';

const inventoryFilters = ['All', 'Low Stock', 'Critical', 'Expiring Soon'] as const;

export default function InventoryScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<string>('All');
  const [category, setCategory] = useState('All');
  const [priceEditor, setPriceEditor] = useState<{ stockItemId: string; value: string } | null>(null);
  const [itemEditor, setItemEditor] = useState<{
    id?: string;
    name: string;
    category: StockCategory;
    unit: string;
    price: string;
    averageOrderQty: string;
    requiresExpiry: boolean;
  } | null>(null);
  const [adjustEditor, setAdjustEditor] = useState<{ batchId: string; itemName: string; batchNumber: string; delta: string; note: string } | null>(null);
  const { currentUser, branches, stockItems, inventory, stockBatches, orders, updateStockItemPrice, upsertStockItem, adjustStockBatch, language, themeColors, t } = useApp();
  const isArabic = language === 'ar';
  const canReceiveStock = currentUser?.role === 'admin' || currentUser?.role === 'warehouse';
  const canEditPrices = currentUser?.role === 'admin';
  const canManageItems = currentUser?.role === 'admin';
  const editingStock = priceEditor
    ? stockItems.find((stock) => stock.id === priceEditor.stockItemId)
    : undefined;

  const showDemoMessage = (action: string) => {
    Alert.alert(t('demoAction'), t('demoInventory', { action }));
  };

  const openItemEditor = (stock?: StockItem) => {
    setItemEditor({
      id: stock?.id,
      name: stock?.name ?? '',
      category: stock?.category ?? 'Add-ons',
      unit: stock?.unit ?? 'pack',
      price: String(stock?.price ?? 0),
      averageOrderQty: String(stock?.averageOrderQty ?? 1),
      requiresExpiry: stock?.requiresExpiry ?? true,
    });
  };

  const saveItem = async () => {
    if (!itemEditor) return;
    const price = Number(itemEditor.price.replace(',', '.'));
    const averageOrderQty = Number(itemEditor.averageOrderQty.replace(',', '.'));
    if (!itemEditor.name.trim() || !itemEditor.unit.trim() || !Number.isFinite(price) || !Number.isFinite(averageOrderQty)) {
      Alert.alert('Invalid item', 'Name, unit, price, and average order quantity are required.');
      return;
    }

    const result = await upsertStockItem({
      id: itemEditor.id,
      name: itemEditor.name.trim(),
      category: itemEditor.category,
      unit: itemEditor.unit.trim(),
      price,
      averageOrderQty,
      requiresExpiry: itemEditor.requiresExpiry,
    });

    if (!result.ok) {
      Alert.alert('Could not save item', result.error ?? 'Try again.');
      return;
    }

    setItemEditor(null);
  };

  const saveAdjustment = async () => {
    if (!adjustEditor) return;
    const delta = Number(adjustEditor.delta.replace(',', '.'));
    if (!Number.isFinite(delta) || delta === 0 || !adjustEditor.note.trim()) {
      Alert.alert('Invalid adjustment', 'Enter a non-zero quantity and a note.');
      return;
    }

    const result = await adjustStockBatch(adjustEditor.batchId, delta, adjustEditor.note.trim());
    if (!result.ok) {
      Alert.alert('Could not adjust stock', result.error ?? 'Try again.');
      return;
    }

    setAdjustEditor(null);
  };

  const items = useMemo(() => {
    return inventory
      .map((inv) => {
        const stock = stockItems.find((s) => s.id === inv.stockItemId);
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
  }, [filter, category, inventory, stockItems]);

  const reorderSuggestions = useMemo(() => {
    return inventory
      .map((inv) => {
        const stock = stockItems.find((s) => s.id === inv.stockItemId);
        if (!stock) return null;
        const targetStock = Math.max(inv.minimumStock * 2, inv.minimumStock + stock.averageOrderQty);
        const suggestedQty = Math.max(0, targetStock - inv.currentStock);
        return { stock, suggestedQty };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item && item.suggestedQty > 0))
      .sort((a, b) => b.suggestedQty - a.suggestedQty)
      .slice(0, 5);
  }, [inventory, stockItems]);

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
          {canManageItems && (
            <AppButton
              title={isArabic ? 'Add Item' : 'Add Item'}
              onPress={() => openItemEditor()}
              variant="outline"
              style={styles.topBtn}
              textStyle={styles.topBtnText}
            />
          )}
          {canReceiveStock && (
            <AppButton
              title={isArabic ? 'استلام مخزون' : 'Receive Stock'}
              onPress={() => router.push('/(main)/receive-stock')}
              variant="success"
              style={styles.topBtn}
              textStyle={styles.topBtnText}
            />
          )}
          <AppButton
            title={isArabic ? 'تعديل مخزون' : 'Adjust Stock'}
            onPress={() => showDemoMessage(isArabic ? 'Select a batch from an item to adjust it.' : 'Select a batch from an item to adjust it.')}
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
          const activeBatches = stockBatches
            .filter((batch) => batch.stockItemId === stock.id && batch.currentQuantity > 0)
            .sort((a, b) => (a.expiryDate ?? '9999-12-31').localeCompare(b.expiryDate ?? '9999-12-31'));
          const earliestBatch = activeBatches[0];
          const getBatchBranches = (batchId: string) => {
            const branchIds = new Set<string>();
            orders.forEach((order) => {
              const hasBatch = order.lines.some((line) =>
                line.allocations?.some((allocation) => allocation.batchId === batchId)
              );
              if (hasBatch) branchIds.add(order.branchId);
            });
            return Array.from(branchIds)
              .map((branchId) => branches.find((branch) => branch.id === branchId)?.name)
              .filter(Boolean)
              .join(', ');
          };

          return (
            <AppCard key={inv.id} style={styles.itemCard}>
              <View style={styles.itemRow}>
                <Text style={styles.emoji}>{stock.imageEmoji}</Text>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: themeColors.text }, isArabic && styles.rtlText]}>{stock.name}</Text>
                  <Text style={[styles.itemCategory, { color: themeColors.textSecondary }, isArabic && styles.rtlText]}>
                    {stock.category} - {stock.unit}
                  </Text>
                  <View style={styles.priceRow}>
                    <Text style={[styles.priceText, { color: themeColors.primary }]}>
                      {formatCurrency(stock.price)}
                    </Text>
                    {canEditPrices && (
                      <TouchableOpacity
                        style={[styles.editPriceButton, { borderColor: themeColors.border }]}
                        onPress={() => setPriceEditor({ stockItemId: stock.id, value: String(stock.price) })}
                      >
                        <Text style={[styles.editPriceText, { color: themeColors.primary }]}>
                          {isArabic ? 'Edit price' : 'Edit price'}
                        </Text>
                      </TouchableOpacity>
                    )}
                    {canManageItems && (
                      <TouchableOpacity
                        style={[styles.editPriceButton, { borderColor: themeColors.border }]}
                        onPress={() => openItemEditor(stock)}
                      >
                        <Text style={[styles.editPriceText, { color: themeColors.primary }]}>
                          {isArabic ? 'Edit item' : 'Edit item'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
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
                  {earliestBatch && (
                    <Text style={[styles.batchMeta, { color: themeColors.textSecondary }, isArabic && styles.rtlText]}>
                      FEFO: {earliestBatch.batchNumber} - {activeBatches.length} active batch{activeBatches.length === 1 ? '' : 'es'}
                    </Text>
                  )}
                  {activeBatches.slice(0, 3).map((batch) => {
                    const branchNames = getBatchBranches(batch.id);

                    return (
                      <View key={batch.id} style={[styles.batchRow, { borderColor: themeColors.border }]}>
                        <Text style={[styles.batchLine, { color: themeColors.text }]}>
                          {batch.batchNumber}: {batch.currentQuantity} left{batch.expiryDate ? `, exp ${batch.expiryDate}` : ''}
                        </Text>
                        {canReceiveStock && (
                          <TouchableOpacity
                            style={[styles.adjustBatchButton, { borderColor: themeColors.border }]}
                            onPress={() =>
                              setAdjustEditor({
                                batchId: batch.id,
                                itemName: stock.name,
                                batchNumber: batch.batchNumber,
                                delta: '',
                                note: '',
                              })
                            }
                          >
                            <Text style={[styles.editPriceText, { color: themeColors.primary }]}>Adjust</Text>
                          </TouchableOpacity>
                        )}
                        {branchNames ? (
                          <Text style={[styles.batchTrace, { color: themeColors.textSecondary }]}>
                            Sent to: {branchNames}
                          </Text>
                        ) : null}
                      </View>
                    );
                  })}
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

      <Modal visible={!!priceEditor} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: themeColors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>
              {isArabic ? 'Edit price' : 'Edit price'}
            </Text>
            <Text style={[styles.modalSubtitle, { color: themeColors.textSecondary }]}>
              {editingStock?.name}
            </Text>
            <TextInput
              style={[
                styles.priceInput,
                {
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.borderStrong,
                  color: themeColors.text,
                },
              ]}
              value={priceEditor?.value ?? ''}
              onChangeText={(value) => setPriceEditor((prev) => (prev ? { ...prev, value } : prev))}
              placeholder="0.00"
              placeholderTextColor={themeColors.textSecondary}
              keyboardType="decimal-pad"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setPriceEditor(null)}>
                <Text style={[styles.cancelText, { color: themeColors.textSecondary }]}>
                  {isArabic ? 'Cancel' : 'Cancel'}
                </Text>
              </TouchableOpacity>
              <AppButton
                title={isArabic ? 'Save price' : 'Save price'}
                onPress={() => {
                  if (!priceEditor) return;
                  const parsedPrice = Number(priceEditor.value.replace(',', '.'));
                  if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
                    Alert.alert('Invalid price', 'Enter a valid price greater than or equal to 0.');
                    return;
                  }
                  updateStockItemPrice(priceEditor.stockItemId, parsedPrice);
                  setPriceEditor(null);
                }}
                style={styles.savePriceButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!itemEditor} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: themeColors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>{itemEditor?.id ? 'Edit item' : 'Add item'}</Text>
            <TextInput
              style={[styles.priceInput, styles.formInput, { backgroundColor: themeColors.background, borderColor: themeColors.borderStrong, color: themeColors.text }]}
              value={itemEditor?.name ?? ''}
              onChangeText={(value) => setItemEditor((prev) => (prev ? { ...prev, name: value } : prev))}
              placeholder="Item name"
              placeholderTextColor={themeColors.textSecondary}
            />
            <TextInput
              style={[styles.priceInput, styles.formInput, { backgroundColor: themeColors.background, borderColor: themeColors.borderStrong, color: themeColors.text }]}
              value={itemEditor?.category ?? ''}
              onChangeText={(value) => setItemEditor((prev) => (prev ? { ...prev, category: value as StockCategory } : prev))}
              placeholder="Category"
              placeholderTextColor={themeColors.textSecondary}
            />
            <TextInput
              style={[styles.priceInput, styles.formInput, { backgroundColor: themeColors.background, borderColor: themeColors.borderStrong, color: themeColors.text }]}
              value={itemEditor?.unit ?? ''}
              onChangeText={(value) => setItemEditor((prev) => (prev ? { ...prev, unit: value } : prev))}
              placeholder="Unit, e.g. kg / pack / box"
              placeholderTextColor={themeColors.textSecondary}
            />
            <View style={styles.inlineInputs}>
              <TextInput
                style={[styles.priceInput, styles.inlineInput, { backgroundColor: themeColors.background, borderColor: themeColors.borderStrong, color: themeColors.text }]}
                value={itemEditor?.price ?? ''}
                onChangeText={(value) => setItemEditor((prev) => (prev ? { ...prev, price: value } : prev))}
                placeholder="Price"
                placeholderTextColor={themeColors.textSecondary}
                keyboardType="decimal-pad"
              />
              <TextInput
                style={[styles.priceInput, styles.inlineInput, { backgroundColor: themeColors.background, borderColor: themeColors.borderStrong, color: themeColors.text }]}
                value={itemEditor?.averageOrderQty ?? ''}
                onChangeText={(value) => setItemEditor((prev) => (prev ? { ...prev, averageOrderQty: value } : prev))}
                placeholder="Avg order"
                placeholderTextColor={themeColors.textSecondary}
                keyboardType="decimal-pad"
              />
            </View>
            <TouchableOpacity
              style={[styles.expiryToggle, { borderColor: themeColors.border }]}
              onPress={() => setItemEditor((prev) => (prev ? { ...prev, requiresExpiry: !prev.requiresExpiry } : prev))}
            >
              <Text style={[styles.editPriceText, { color: themeColors.text }]}>
                Requires expiry: {itemEditor?.requiresExpiry ? 'Yes' : 'No'}
              </Text>
            </TouchableOpacity>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setItemEditor(null)}>
                <Text style={[styles.cancelText, { color: themeColors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <AppButton title="Save item" onPress={saveItem} style={styles.savePriceButton} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!adjustEditor} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: themeColors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Adjust batch</Text>
            <Text style={[styles.modalSubtitle, { color: themeColors.textSecondary }]}>
              {adjustEditor?.itemName} - {adjustEditor?.batchNumber}
            </Text>
            <TextInput
              style={[styles.priceInput, styles.formInput, { backgroundColor: themeColors.background, borderColor: themeColors.borderStrong, color: themeColors.text }]}
              value={adjustEditor?.delta ?? ''}
              onChangeText={(value) => setAdjustEditor((prev) => (prev ? { ...prev, delta: value } : prev))}
              placeholder="+5 or -2"
              placeholderTextColor={themeColors.textSecondary}
              keyboardType="decimal-pad"
            />
            <TextInput
              style={[styles.priceInput, styles.noteInput, { backgroundColor: themeColors.background, borderColor: themeColors.borderStrong, color: themeColors.text }]}
              value={adjustEditor?.note ?? ''}
              onChangeText={(value) => setAdjustEditor((prev) => (prev ? { ...prev, note: value } : prev))}
              placeholder="Reason for adjustment"
              placeholderTextColor={themeColors.textSecondary}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setAdjustEditor(null)}>
                <Text style={[styles.cancelText, { color: themeColors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <AppButton title="Save adjustment" onPress={saveAdjustment} style={styles.savePriceButton} />
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
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4, flexWrap: 'wrap' },
  priceText: { fontSize: 15, fontWeight: '800' },
  editPriceButton: {
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  editPriceText: { fontSize: 12, fontWeight: '800' },
  stockRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  stockCurrent: { fontSize: 22, fontWeight: '800' },
  stockMin: { fontSize: 14 },
  expiry: { fontSize: 12, marginTop: 2 },
  batchMeta: { fontSize: 12, marginTop: 2 },
  batchRow: { borderTopWidth: 1, marginTop: spacing.xs, paddingTop: spacing.xs },
  batchLine: { fontSize: 12, fontWeight: '700' },
  batchTrace: { fontSize: 11, marginTop: 2 },
  adjustBatchButton: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: borderRadius.full, marginTop: 4, paddingHorizontal: 8, paddingVertical: 3 },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: 108,
  },
  statusText: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  modalSubtitle: { fontSize: 14, marginTop: 2, marginBottom: spacing.md },
  priceInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    fontSize: 18,
    fontWeight: '700',
  },
  formInput: { marginTop: spacing.sm, fontSize: 15, fontWeight: '600' },
  inlineInputs: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  inlineInput: { flex: 1, fontSize: 15, fontWeight: '600' },
  expiryToggle: { borderWidth: 1, borderRadius: borderRadius.md, padding: spacing.sm, marginTop: spacing.sm },
  noteInput: { minHeight: 88, paddingTop: spacing.sm, textAlignVertical: 'top', marginTop: spacing.sm },
  modalButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  cancelText: { fontSize: 16, fontWeight: '700', padding: spacing.sm },
  savePriceButton: { minWidth: 140 },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
