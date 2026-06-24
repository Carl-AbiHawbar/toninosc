import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { AppCard } from '@/components/AppCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SearchBar } from '@/components/SearchBar';
import { useApp } from '@/context/AppContext';
import { spacing } from '@/theme/spacing';
import { useMemo, useState } from 'react';

export default function SuppliersScreen() {
  const { currentUser, suppliers, stockItems, language, themeColors, setPrimarySupplier } = useApp();
  const [search, setSearch] = useState('');
  const isArabic = language === 'ar';
  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'warehouse';

  const handleSetPrimary = async (stockItemId: string, supplierId: string) => {
    const result = await setPrimarySupplier(stockItemId, supplierId);
    if (!result.ok) {
      Alert.alert(isArabic ? 'Could not update supplier' : 'Could not update supplier', result.error ?? 'Try again.');
    }
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
          .sort((a, b) => a.item.name.localeCompare(b.item.name));

        return { supplier, suppliedItems };
      })
      .filter(({ supplier, suppliedItems }) => {
        if (!query) return true;
        return (
          `${supplier.name} ${supplier.contactName} ${supplier.phone} ${supplier.email}`.toLowerCase().includes(query) ||
          suppliedItems.some(({ item }) => `${item.name} ${item.category}`.toLowerCase().includes(query))
        );
      });
  }, [search, stockItems, suppliers]);

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

            {suppliedItems.length === 0 ? (
              <Text style={[styles.empty, { color: themeColors.textSecondary }]}>No supplied items linked yet.</Text>
            ) : (
              suppliedItems.map(({ item, source }) => (
                <View key={item.id} style={[styles.itemRow, { borderTopColor: themeColors.border }]}>
                  <View style={styles.itemText}>
                    <Text style={[styles.itemName, { color: themeColors.text }]}>{item.name}</Text>
                    <Text style={[styles.itemMeta, { color: themeColors.textSecondary }]}>
                      {item.category} · {source?.supplierUnit ?? item.unit}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
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
});
