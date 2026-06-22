import { useMemo, useState } from 'react';
import { Alert, Text, View, ScrollView, StyleSheet, SafeAreaView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AppCard } from '@/components/AppCard';
import { AppButton } from '@/components/AppButton';
import { SearchBar } from '@/components/SearchBar';
import { QuantityStepper } from '@/components/QuantityStepper';
import { useApp } from '@/context/AppContext';
import { borderRadius, spacing } from '@/theme/spacing';

type ReceiveLine = {
  stockItemId: string;
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
  const [supplierId, setSupplierId] = useState('');
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<ReceiveLine[]>([]);

  const selectedSupplier = suppliers.find((supplier) => supplier.id === supplierId);
  const lineCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return stockItems
      .filter((item) => {
        if (!query) return true;
        return `${item.name} ${item.category} ${item.unit}`.toLowerCase().includes(query);
      })
      .slice(0, 40);
  }, [search, stockItems]);

  const getQuantity = (stockItemId: string) =>
    lines.find((line) => line.stockItemId === stockItemId)?.quantity ?? 0;

  const getLine = (stockItemId: string) => lines.find((line) => line.stockItemId === stockItemId);

  const getDefaultBatchNumber = (stockItemId: string) => {
    const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    return `TN-${stockItemId.replace('stock-', '').padStart(3, '0')}-${datePart}`;
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
          quantity,
          batchNumber: getDefaultBatchNumber(stockItemId),
          productionDate: '',
          expiryDate: '',
        },
      ];
    });
  };

  const updateLineField = (stockItemId: string, field: keyof Omit<ReceiveLine, 'stockItemId' | 'quantity'>, value: string) => {
    setLines((prev) => prev.map((line) => (line.stockItemId === stockItemId ? { ...line, [field]: value } : line)));
  };

  const handleConfirm = async () => {
    if (lines.length === 0) {
      Alert.alert(isArabic ? 'لا توجد مواد' : 'No items', isArabic ? 'أضف مواد قبل التأكيد.' : 'Add items before confirming.');
      return;
    }

    const invalidLine = lines.find((line) => {
      const stock = stockItems.find((item) => item.id === line.stockItemId);
      if (!line.batchNumber.trim()) return true;
      if (stock?.requiresExpiry === false) return false;
      if (!line.productionDate || !line.expiryDate) return true;
      return new Date(line.expiryDate) <= new Date(line.productionDate);
    });

    if (invalidLine) {
      Alert.alert(
        isArabic ? 'Batch details required' : 'Batch details required',
        isArabic
          ? 'Each item needs a batch number, production date, and expiry date.'
          : 'Each item needs a batch number, production date, and expiry date. Expiry must be after production.'
      );
      return;
    }

    const activeSupplierId = supplierId || suppliers[0]?.id;

    await receiveStock(
      lines.map((line) => ({ ...line, supplierId: activeSupplierId })),
      `${selectedSupplier?.name ?? 'Supplier'}${note ? ` - ${note}` : ''}`
    );
    Alert.alert(
      isArabic ? 'تم الاستلام' : 'Stock received',
      isArabic ? 'تمت إضافة الكميات إلى المخزون.' : 'Quantities were added to storage.',
      [{ text: 'OK', onPress: () => router.replace('/(main)/inventory') }]
    );
  };

  if (!canReceiveStock) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
        <View style={styles.container}>
          <ScreenHeader title={isArabic ? 'غير مسموح' : 'Not Allowed'} />
          <AppCard>
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }, isArabic && styles.rtlText]}>
              {isArabic ? 'استلام المخزون متاح للمدير والمستودع فقط.' : 'Receiving stock is available to admin and warehouse users only.'}
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
          title={isArabic ? 'استلام مخزون' : 'Receive Stock'}
          subtitle={isArabic ? 'أضف كميات وصلت من المورد' : 'Add supplier delivery quantities'}
        />

        <Text style={[styles.sectionTitle, { color: themeColors.text }, isArabic && styles.rtlText]}>
          {isArabic ? 'المورد' : 'Supplier'}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.supplierScroll}>
          {suppliers.map((supplier) => (
            <AppButton
              key={supplier.id}
              title={supplier.name}
              onPress={() => setSupplierId(supplier.id)}
              variant={(supplierId || suppliers[0]?.id) === supplier.id ? 'primary' : 'outline'}
              style={styles.supplierButton}
              textStyle={styles.supplierText}
            />
          ))}
        </ScrollView>

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
          placeholder={isArabic ? 'رقم فاتورة المورد أو ملاحظة...' : 'Supplier invoice number or note...'}
          placeholderTextColor={themeColors.textSecondary}
        />

        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={isArabic ? 'ابحث عن مادة...' : 'Search stock items...'}
        />

        {lines.length > 0 && (
          <AppCard style={styles.summaryCard}>
            <Text style={[styles.summaryText, { color: themeColors.text }, isArabic && styles.rtlText]}>
              {isArabic ? `${lines.length} مواد، ${lineCount} كمية إجمالية` : `${lines.length} items, ${lineCount} total quantity`}
            </Text>
            <AppButton
              title={isArabic ? 'تأكيد الاستلام' : 'Confirm Receipt'}
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

          return (
            <AppCard key={item.id} style={styles.itemCard}>
              <View style={styles.itemRow}>
                <Text style={styles.emoji}>{item.imageEmoji}</Text>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: themeColors.text }, isArabic && styles.rtlText]}>{item.name}</Text>
                  <Text style={[styles.itemMeta, { color: themeColors.textSecondary }, isArabic && styles.rtlText]}>
                    {isArabic ? 'حالي' : 'Current'}: {inv?.currentStock ?? 0} {item.unit}
                  </Text>
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
                  <TextInput
                    style={[
                      styles.batchInput,
                      { backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text },
                    ]}
                    value={line.batchNumber}
                    onChangeText={(value) => updateLineField(item.id, 'batchNumber', value)}
                    placeholder={isArabic ? 'Batch number' : 'Batch number'}
                    placeholderTextColor={themeColors.textSecondary}
                  />
                  {needsExpiry ? (
                    <View style={styles.dateRow}>
                      <TextInput
                        style={[
                          styles.dateInput,
                          { backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text },
                        ]}
                        value={line.productionDate}
                        onChangeText={(value) => updateLineField(item.id, 'productionDate', value)}
                        placeholder={isArabic ? 'Production YYYY-MM-DD' : 'Production YYYY-MM-DD'}
                        placeholderTextColor={themeColors.textSecondary}
                      />
                      <TextInput
                        style={[
                          styles.dateInput,
                          { backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text },
                        ]}
                        value={line.expiryDate}
                        onChangeText={(value) => updateLineField(item.id, 'expiryDate', value)}
                        placeholder={isArabic ? 'Expiry YYYY-MM-DD' : 'Expiry YYYY-MM-DD'}
                        placeholderTextColor={themeColors.textSecondary}
                      />
                    </View>
                  ) : (
                    <Text style={[styles.noExpiryText, { color: themeColors.textSecondary }, isArabic && styles.rtlText]}>
                      {isArabic ? 'لا يحتاج تاريخ انتهاء' : 'No expiry required'}
                    </Text>
                  )}
                </View>
              )}
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
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: spacing.sm },
  supplierScroll: { marginBottom: spacing.md, maxHeight: 52 },
  supplierButton: { marginRight: spacing.sm, minHeight: 42, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  supplierText: { fontSize: 13 },
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
    fontSize: 13,
  },
  noExpiryText: { fontSize: 13, fontWeight: '700' },
  emptyText: { fontSize: 15, textAlign: 'center' },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
