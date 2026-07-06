import { Alert, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { AppCard } from '@/components/AppCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SearchBar } from '@/components/SearchBar';
import { useApp } from '@/context/AppContext';
import { spacing } from '@/theme/spacing';
import { getStockItemCategory, getStockItemName, getStockItemSearchText, getStockItemUnit } from '@/utils/stockLocalization';
import { useMemo, useState } from 'react';

export default function SuppliersScreen() {
  const { currentUser, suppliers, stockItems, language, themeColors, setPrimarySupplier, upsertSupplier } = useApp();
  const [search, setSearch] = useState('');
  const [supplierEditor, setSupplierEditor] = useState<{
    id?: string;
    name: string;
    contactName: string;
    phone: string;
    email: string;
    leadTimeDays: string;
  } | null>(null);
  const isArabic = language === 'ar';
  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'warehouse';

  const handleSetPrimary = async (stockItemId: string, supplierId: string) => {
    const result = await setPrimarySupplier(stockItemId, supplierId);
    if (!result.ok) {
      Alert.alert(isArabic ? 'Could not update supplier' : 'Could not update supplier', result.error ?? 'Try again.');
    }
  };

  const saveSupplier = async () => {
    if (!supplierEditor) return;
    const leadTimeDays = Number.parseInt(supplierEditor.leadTimeDays, 10);
    if (!supplierEditor.name.trim()) {
      Alert.alert('Invalid supplier', 'Supplier name is required.');
      return;
    }

    const result = await upsertSupplier({
      id: supplierEditor.id,
      name: supplierEditor.name.trim(),
      contactName: supplierEditor.contactName.trim(),
      phone: supplierEditor.phone.trim(),
      email: supplierEditor.email.trim(),
      leadTimeDays: Number.isFinite(leadTimeDays) ? leadTimeDays : 0,
    });

    if (!result.ok) {
      Alert.alert('Could not save supplier', result.error ?? 'Try again.');
      return;
    }

    setSupplierEditor(null);
  };

  const supplierCards = useMemo(() => {
    const query = search.trim().toLowerCase();

    return suppliers
      .map((supplier) => {
        const suppliedItems = stockItems
          .filter((item) => item.suppliers?.some((source) => source.supplierId === supplier.id))
          .map((item) => ({
            item,
            source: item.suppliers?.find((source) => source.supplierId === supplier.id),
          }))
          .sort((a, b) => getStockItemName(a.item, language).localeCompare(getStockItemName(b.item, language)));

        return { supplier, suppliedItems };
      })
      .filter(({ supplier, suppliedItems }) => {
        if (!query) return true;
        return (
          `${supplier.name} ${supplier.contactName} ${supplier.phone} ${supplier.email}`.toLowerCase().includes(query) ||
          suppliedItems.some(({ item }) => getStockItemSearchText(item, language).includes(query))
        );
      });
  }, [language, search, stockItems, suppliers]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader
          title={isArabic ? 'Suppliers' : 'Suppliers'}
          subtitle={isArabic ? 'Supplier list and supplied items' : 'Supplier list and supplied items'}
        />

        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={isArabic ? 'Search suppliers or items...' : 'Search suppliers or items...'}
        />

        {currentUser?.role === 'admin' && (
          <AppButton
            title={isArabic ? 'Add supplier' : 'Add supplier'}
            onPress={() => setSupplierEditor({ name: '', contactName: '', phone: '', email: '', leadTimeDays: '0' })}
            style={styles.addButton}
          />
        )}

        {supplierCards.map(({ supplier, suppliedItems }) => (
          <AppCard key={supplier.id} style={styles.card}>
            <View style={styles.header}>
              <View style={styles.titleBlock}>
                <Text style={[styles.name, { color: themeColors.text }]}>{supplier.name}</Text>
                <Text style={[styles.meta, { color: themeColors.textSecondary }]}>
                  {supplier.contactName || 'No contact name'} · {supplier.phone || 'No phone'}
                </Text>
                <Text style={[styles.meta, { color: themeColors.textSecondary }]}>
                  {supplier.email || 'No email'} · {supplier.leadTimeDays} day lead time
                </Text>
              </View>
              <Text style={[styles.count, { color: themeColors.primary }]}>{suppliedItems.length}</Text>
            </View>
            {currentUser?.role === 'admin' && (
              <TouchableOpacity
                style={[styles.editSupplierButton, { borderColor: themeColors.border }]}
                onPress={() =>
                  setSupplierEditor({
                    id: supplier.id,
                    name: supplier.name,
                    contactName: supplier.contactName,
                    phone: supplier.phone,
                    email: supplier.email,
                    leadTimeDays: String(supplier.leadTimeDays),
                  })
                }
              >
                <Text style={[styles.editSupplierText, { color: themeColors.primary }]}>Edit supplier</Text>
              </TouchableOpacity>
            )}

            {suppliedItems.length === 0 ? (
              <Text style={[styles.empty, { color: themeColors.textSecondary }]}>No supplied items linked yet.</Text>
            ) : (
              suppliedItems.map(({ item, source }) => (
                <View key={item.id} style={[styles.itemRow, { borderTopColor: themeColors.border }]}>
                  <View style={styles.itemText}>
                    <Text style={[styles.itemName, { color: themeColors.text }, isArabic && styles.rtlText]}>
                      {getStockItemName(item, language)}
                    </Text>
                    <Text style={[styles.itemMeta, { color: themeColors.textSecondary }]}>
                      {getStockItemCategory(item, language)} - {source?.supplierUnit ?? getStockItemUnit(item, language)}
                    </Text>
                  </View>
                  <View style={styles.itemBadges}>
                    {source?.lastPrice != null && (
                      <Text style={[styles.price, { color: themeColors.text }]}>${source.lastPrice.toFixed(2)}</Text>
                    )}
                    {source?.isPrimary ? (
                      <Text style={[styles.primary, { color: themeColors.success, backgroundColor: themeColors.successSoft }]}>
                        Primary
                      </Text>
                    ) : canManage ? (
                      <AppButton
                        title="Make primary"
                        onPress={() => handleSetPrimary(item.id, supplier.id)}
                        variant="outline"
                        style={styles.primaryButton}
                        textStyle={styles.primaryButtonText}
                      />
                    ) : null}
                  </View>
                </View>
              ))
            )}
          </AppCard>
        ))}
      </ScrollView>

      <Modal visible={!!supplierEditor} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: themeColors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>
              {supplierEditor?.id ? 'Edit supplier' : 'Add supplier'}
            </Text>
            <TextInput style={[styles.input, { backgroundColor: themeColors.background, borderColor: themeColors.borderStrong, color: themeColors.text }]} value={supplierEditor?.name ?? ''} onChangeText={(value) => setSupplierEditor((prev) => (prev ? { ...prev, name: value } : prev))} placeholder="Supplier name" placeholderTextColor={themeColors.textSecondary} />
            <TextInput style={[styles.input, { backgroundColor: themeColors.background, borderColor: themeColors.borderStrong, color: themeColors.text }]} value={supplierEditor?.contactName ?? ''} onChangeText={(value) => setSupplierEditor((prev) => (prev ? { ...prev, contactName: value } : prev))} placeholder="Contact name" placeholderTextColor={themeColors.textSecondary} />
            <TextInput style={[styles.input, { backgroundColor: themeColors.background, borderColor: themeColors.borderStrong, color: themeColors.text }]} value={supplierEditor?.phone ?? ''} onChangeText={(value) => setSupplierEditor((prev) => (prev ? { ...prev, phone: value } : prev))} placeholder="Phone" placeholderTextColor={themeColors.textSecondary} />
            <TextInput style={[styles.input, { backgroundColor: themeColors.background, borderColor: themeColors.borderStrong, color: themeColors.text }]} value={supplierEditor?.email ?? ''} onChangeText={(value) => setSupplierEditor((prev) => (prev ? { ...prev, email: value } : prev))} placeholder="Email" placeholderTextColor={themeColors.textSecondary} keyboardType="email-address" />
            <TextInput style={[styles.input, { backgroundColor: themeColors.background, borderColor: themeColors.borderStrong, color: themeColors.text }]} value={supplierEditor?.leadTimeDays ?? ''} onChangeText={(value) => setSupplierEditor((prev) => (prev ? { ...prev, leadTimeDays: value } : prev))} placeholder="Lead time days" placeholderTextColor={themeColors.textSecondary} keyboardType="number-pad" />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setSupplierEditor(null)}>
                <Text style={[styles.cancelText, { color: themeColors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <AppButton title="Save supplier" onPress={saveSupplier} style={styles.saveButton} />
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
  addButton: { marginBottom: spacing.md, minHeight: 44 },
  card: { marginBottom: spacing.md },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.sm },
  titleBlock: { flex: 1 },
  name: { fontSize: 18, fontWeight: '800' },
  meta: { fontSize: 13, marginTop: 2 },
  count: { fontSize: 24, fontWeight: '900' },
  empty: { fontSize: 14 },
  itemRow: { borderTopWidth: 1, paddingTop: spacing.sm, marginTop: spacing.sm, flexDirection: 'row', gap: spacing.sm },
  itemText: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '800' },
  itemMeta: { fontSize: 12, marginTop: 2 },
  itemBadges: { alignItems: 'flex-end', gap: 4 },
  price: { fontSize: 13, fontWeight: '800' },
  primary: { fontSize: 11, fontWeight: '900', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  primaryButton: { minHeight: 32, paddingHorizontal: 8, paddingVertical: 2 },
  primaryButtonText: { fontSize: 11 },
  editSupplierButton: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, marginBottom: spacing.sm },
  editSupplierText: { fontSize: 12, fontWeight: '800' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: spacing.lg },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: spacing.md },
  input: { borderWidth: 1, borderRadius: 8, minHeight: 46, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  modalButtons: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  cancelText: { fontSize: 16, fontWeight: '700', padding: spacing.sm },
  saveButton: { minWidth: 140 },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
