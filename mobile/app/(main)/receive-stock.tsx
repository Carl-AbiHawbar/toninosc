import { useMemo, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { AppButton } from '@/components/AppButton';
import { AppCard } from '@/components/AppCard';
import { QuantityStepper } from '@/components/QuantityStepper';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SearchBar } from '@/components/SearchBar';
import { useApp } from '@/context/AppContext';
import { StockItemSupplier } from '@/types';
import { borderRadius, spacing } from '@/theme/spacing';

type ReceiveLine = {
  stockItemId: string;
  supplierId: string;
  quantity: number;
  batchNumber: string;
  productionDate?: string;
  expiryDate?: string;
};

export default function ReceiveStockScreen() {
  const router = useRouter();
  const { currentUser, stockItems, inventory, suppliers, language, themeColors, receiveStock } = useApp();
  const isArabic = language === 'ar';
  const canReceiveStock = currentUser?.role === 'admin' || currentUser?.role === 'warehouse';
  const [search, setSearch] = useState('');
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<ReceiveLine[]>([]);
  const [datePicker, setDatePicker] = useState<{ stockItemId: string; field: 'productionDate' | 'expiryDate' } | null>(null);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return stockItems
      .filter((item) => !query || `${item.name} ${item.category} ${item.unit}`.toLowerCase().includes(query))
      .slice(0, 40);
  }, [search, stockItems]);

  const lineCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const getLine = (stockItemId: string) => lines.find((line) => line.stockItemId === stockItemId);
  const getQuantity = (stockItemId: string) => getLine(stockItemId)?.quantity ?? 0;

  const getItemSupplierOptions = (item: typeof stockItems[number]): StockItemSupplier[] => {
    if (item.suppliers?.length) return item.suppliers;

    return suppliers.map((supplier) => ({
      id: supplier.id,
      supplierId: supplier.id,
      supplierName: supplier.name,
      isPrimary: supplier.id === item.supplierId,
      active: true,
    }));
  };

  const getDefaultSupplierId = (stockItemId: string) => {
    const item = stockItems.find((stock) => stock.id === stockItemId);
    const primarySupplier = item?.suppliers?.find((supplier) => supplier.isPrimary && supplier.active);
    return primarySupplier?.supplierId ?? item?.supplierId ?? item?.suppliers?.[0]?.supplierId ?? suppliers[0]?.id ?? '';
  };

  const updateQuantity = (stockItemId: string, quantity: number) => {
    setLines((prev) => {
      if (quantity <= 0) return prev.filter((line) => line.stockItemId !== stockItemId);
      const existing = prev.find((line) => line.stockItemId === stockItemId);
      if (existing) {
        return prev.map((line) => (line.stockItemId === stockItemId ? { ...line, quantity } : line));
      }
      return [
        ...prev,
        {
          stockItemId,
          supplierId: getDefaultSupplierId(stockItemId),
          quantity,
          batchNumber: '',
          productionDate: '',
          expiryDate: '',
        },
      ];
    });
  };

  const updateLineField = (
    stockItemId: string,
    field: keyof Omit<ReceiveLine, 'stockItemId' | 'quantity'>,
    value: string
  ) => {
    setLines((prev) => prev.map((line) => (line.stockItemId === stockItemId ? { ...line, [field]: value } : line)));
  };

  const getPickerDate = () => {
    if (!datePicker) return new Date();
    const value = getLine(datePicker.stockItemId)?.[datePicker.field];
    return value ? new Date(`${value}T00:00:00`) : new Date();
  };

  const handleDateChange = (_event: unknown, selectedDate?: Date) => {
    if (!datePicker) return;
    if (selectedDate) {
      updateLineField(datePicker.stockItemId, datePicker.field, selectedDate.toISOString().slice(0, 10));
    }
    setDatePicker(null);
  };

  const handleConfirm = async () => {
    if (lines.length === 0) {
      Alert.alert(isArabic ? 'No items' : 'No items', isArabic ? 'Add items before confirming.' : 'Add items before confirming.');
      return;
    }

    const invalidLine = lines.find((line) => {
      const stock = stockItems.find((item) => item.id === line.stockItemId);
      if (!line.supplierId || !line.batchNumber.trim()) return true;
      if (stock?.requiresExpiry === false) return false;
      if (!line.productionDate || !line.expiryDate) return true;
      return new Date(line.expiryDate) <= new Date(line.productionDate);
    });

    if (invalidLine) {
      Alert.alert(
        isArabic ? 'Batch details required' : 'Batch details required',
        isArabic
          ? 'Each item needs supplier, batch number, production date, and expiry date.'
          : 'Each item needs supplier, batch number, production date, and expiry date. Expiry must be after production.'
      );
      return;
    }

    await receiveStock(lines, note || 'Supplier delivery');
    Alert.alert(
      isArabic ? 'Stock received' : 'Stock received',
      isArabic ? 'Quantities were added to storage.' : 'Quantities were added to storage.',
      [{ text: 'OK', onPress: () => router.replace('/(main)/inventory') }]
    );
  };

  if (!canReceiveStock) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
        <View style={styles.container}>
          <ScreenHeader title={isArabic ? 'Not allowed' : 'Not allowed'} />
          <AppCard>
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
              {isArabic ? 'Receiving stock is available to admin and warehouse users only.' : 'Receiving stock is available to admin and warehouse users only.'}
            </Text>
          </AppCard>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader
          title={isArabic ? 'Receive stock' : 'Receive stock'}
          subtitle={isArabic ? 'Add supplier delivery quantities' : 'Add supplier delivery quantities'}
        />

        <TextInput
          style={[
            styles.noteInput,
            {
              backgroundColor: themeColors.card,
              borderColor: themeColors.border,
              color: themeColors.text,
              textAlign: isArabic ? 'right' : 'left',
              writingDirection: isArabic ? 'rtl' : 'ltr',
            },
          ]}
          value={note}
          onChangeText={setNote}
          placeholder={isArabic ? 'Supplier invoice number or note...' : 'Supplier invoice number or note...'}
          placeholderTextColor={themeColors.textSecondary}
        />

        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={isArabic ? 'Search stock items...' : 'Search stock items...'}
        />

        {lines.length > 0 && (
          <AppCard style={styles.summaryCard}>
            <Text style={[styles.summaryText, { color: themeColors.text }]}>
              {lines.length} items, {lineCount} total quantity
            </Text>
            <AppButton
              title={isArabic ? 'Confirm receipt' : 'Confirm receipt'}
              onPress={handleConfirm}
              variant="success"
              style={styles.confirmButton}
              textStyle={styles.confirmText}
            />
          </AppCard>
        )}

        {filteredItems.map((item) => {
          const inv = inventory.find((balance) => balance.stockItemId === item.id);
          const quantity = getQuantity(item.id);
          const line = getLine(item.id);
          const needsExpiry = item.requiresExpiry !== false;
          const itemSuppliers = getItemSupplierOptions(item);
          const selectedSupplier = itemSuppliers.find((supplier) => supplier.supplierId === line?.supplierId);

          return (
            <AppCard key={item.id} style={styles.itemCard}>
              <View style={styles.itemRow}>
                <Text style={styles.emoji}>{item.imageEmoji}</Text>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: themeColors.text }]}>{item.name}</Text>
                  <Text style={[styles.itemMeta, { color: themeColors.textSecondary }]}>
                    Current: {inv?.currentStock ?? 0} {item.unit}
                  </Text>
                  {item.suppliers?.length ? (
                    <Text style={[styles.itemMeta, { color: themeColors.textSecondary }]}>
                      {item.suppliers.length} supplier option{item.suppliers.length === 1 ? '' : 's'}
                    </Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.stepperRow}>
                <QuantityStepper
                  quantity={quantity}
                  onIncrease={() => updateQuantity(item.id, quantity + 1)}
                  onDecrease={() => updateQuantity(item.id, quantity - 1)}
                />
              </View>

              {line && (
                <View style={styles.batchFields}>
                  <Text style={[styles.fieldLabel, { color: themeColors.textSecondary }]}>Supplier</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.supplierScroll}>
                    {itemSuppliers.map((supplier) => (
                      <AppButton
                        key={supplier.id}
                        title={supplier.supplierName}
                        onPress={() => updateLineField(item.id, 'supplierId', supplier.supplierId)}
                        variant={line.supplierId === supplier.supplierId ? 'primary' : 'outline'}
                        style={styles.supplierButton}
                        textStyle={styles.supplierText}
                      />
                    ))}
                  </ScrollView>
                  {selectedSupplier?.isPrimary ? (
                    <Text style={[styles.primarySupplierText, { color: themeColors.success }]}>Primary supplier</Text>
                  ) : null}

                  <TextInput
                    style={[
                      styles.batchInput,
                      { backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text },
                    ]}
                    value={line.batchNumber}
                    onChangeText={(value) => updateLineField(item.id, 'batchNumber', value)}
                    placeholder={isArabic ? 'Batch number' : 'Batch number'}
                    placeholderTextColor={themeColors.textSubtle}
                  />

                  {needsExpiry ? (
                    <View style={styles.dateRow}>
                      <TouchableOpacity
                        style={[styles.dateInput, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}
                        onPress={() => setDatePicker({ stockItemId: item.id, field: 'productionDate' })}
                      >
                        <Text style={[styles.dateText, { color: line.productionDate ? themeColors.text : themeColors.textSubtle }]}>
                          {line.productionDate || 'Production date'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.dateInput, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}
                        onPress={() => setDatePicker({ stockItemId: item.id, field: 'expiryDate' })}
                      >
                        <Text style={[styles.dateText, { color: line.expiryDate ? themeColors.text : themeColors.textSubtle }]}>
                          {line.expiryDate || 'Expiry date'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text style={[styles.noExpiryText, { color: themeColors.textSecondary }]}>No expiry required</Text>
                  )}
                </View>
              )}
            </AppCard>
          );
        })}

        {datePicker && (
          <DateTimePicker value={getPickerDate()} mode="date" display="default" onChange={handleDateChange} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  noteInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    marginBottom: spacing.md,
  },
  summaryCard: { marginBottom: spacing.md },
  summaryText: { fontSize: 15, fontWeight: '800', marginBottom: spacing.sm },
  confirmButton: { minHeight: 46 },
  confirmText: { fontSize: 15 },
  itemCard: { marginBottom: spacing.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  emoji: { fontSize: 32, marginRight: spacing.md },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '800' },
  itemMeta: { fontSize: 13, marginTop: 2 },
  stepperRow: { marginTop: spacing.sm, alignItems: 'flex-end' },
  batchFields: { marginTop: spacing.md, gap: spacing.sm },
  fieldLabel: { fontSize: 13, fontWeight: '800' },
  supplierScroll: { maxHeight: 48 },
  supplierButton: { marginRight: spacing.sm, minHeight: 40, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  supplierText: { fontSize: 13 },
  primarySupplierText: { fontSize: 12, fontWeight: '800' },
  batchInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    fontSize: 14,
  },
  dateRow: { flexDirection: 'row', gap: spacing.sm },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
  },
  dateText: { fontSize: 13, fontWeight: '700' },
  noExpiryText: { fontSize: 13, fontWeight: '700' },
  emptyText: { fontSize: 15, textAlign: 'center' },
});
