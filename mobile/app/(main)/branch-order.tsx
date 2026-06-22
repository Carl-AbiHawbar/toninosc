import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Modal,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { stockCategories } from '@/data/mockStockItems';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SearchBar } from '@/components/SearchBar';
import { CategoryFilter } from '@/components/CategoryFilter';
import { ProductCard } from '@/components/ProductCard';
import { AppButton } from '@/components/AppButton';
import { colors } from '@/theme/colors';
import { borderRadius, spacing } from '@/theme/spacing';
import { formatCurrency } from '@/utils/helpers';

export default function BranchOrderScreen() {
  const router = useRouter();
  const { repeat } = useLocalSearchParams<{ repeat?: string }>();
  const {
    cart,
    updateCartItem,
    setCartItemNote,
    getCartTotal,
    getCartItemCount,
    loadLastOrderToCart,
    inventory,
    stockItems,
  } = useApp();
  const { language, themeColors, t } = useApp();
  const isArabic = language === 'ar';

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [noteModal, setNoteModal] = useState<{ stockItemId: string; note: string } | null>(null);

  useEffect(() => {
    if (repeat === 'true') {
      loadLastOrderToCart();
    }
  }, [repeat, loadLastOrderToCart]);

  const filteredItems = useMemo(() => {
    return stockItems.filter((item) => {
      const matchesCategory = category === 'All' || item.category === category;
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [category, search, stockItems]);

  const getQuantity = (stockItemId: string) =>
    cart.find((c) => c.stockItemId === stockItemId)?.quantity ?? 0;

  const getNote = (stockItemId: string) =>
    cart.find((c) => c.stockItemId === stockItemId)?.note;

  const cartCount = getCartItemCount();
  const cartTotal = getCartTotal();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
      <View style={styles.container}>
        <ScreenHeader title={t('createOrder')} subtitle={t('selectItems')} />

        <SearchBar value={search} onChangeText={setSearch} placeholder={t('searchProducts')} />
        <CategoryFilter
          categories={stockCategories}
          selected={category}
          onSelect={setCategory}
        />

        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const qty = getQuantity(item.id);
            const inv = inventory.find((balance) => balance.stockItemId === item.id);
            const showWarning = qty > item.averageOrderQty * 3;

            return (
              <ProductCard
                item={item}
                quantity={qty}
                warehouseStock={inv?.currentStock ?? 0}
                onQuantityChange={(q) => updateCartItem(item.id, q)}
                onNotePress={() =>
                  setNoteModal({ stockItemId: item.id, note: getNote(item.id) ?? '' })
                }
                hasNote={!!getNote(item.id)}
                showWarning={showWarning && qty > 0}
              />
            );
          }}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />

        {cartCount > 0 && (
          <View style={[styles.cartBar, { backgroundColor: themeColors.card, borderTopColor: themeColors.border }]}>
            <View style={styles.cartInfo}>
              <Text style={[styles.cartCount, { color: themeColors.textSecondary }, isArabic && styles.rtlText]}>{t('itemsCount', { count: cartCount })}</Text>
              <Text style={[styles.cartTotal, { color: themeColors.primary }]}>{formatCurrency(cartTotal)}</Text>
            </View>
            <AppButton
              title={t('reviewOrder')}
              onPress={() => router.push('/(main)/order-review')}
              style={styles.reviewBtn}
            />
          </View>
        )}
      </View>

      <Modal visible={!!noteModal} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: themeColors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.modalTitle, { color: themeColors.text }, isArabic && styles.rtlText]}>{t('addNote')}</Text>
            <TextInput
              style={[
                styles.noteInput,
                {
                  borderColor: themeColors.border,
                  color: themeColors.text,
                  backgroundColor: themeColors.background,
                },
              ]}
              value={noteModal?.note ?? ''}
              onChangeText={(text) =>
                setNoteModal((prev) => (prev ? { ...prev, note: text } : null))
              }
              placeholder={t('specialInstructions')}
              placeholderTextColor={themeColors.textSecondary}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setNoteModal(null)}>
                <Text style={[styles.cancelText, { color: themeColors.textSecondary }]}>{t('cancel')}</Text>
              </TouchableOpacity>
              <AppButton
                title={t('save')}
                onPress={() => {
                  if (noteModal) {
                    setCartItemNote(noteModal.stockItemId, noteModal.note);
                    setNoteModal(null);
                  }
                }}
                style={styles.saveBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  list: {
    paddingBottom: 120,
  },
  cartBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  cartInfo: {
    flex: 1,
  },
  cartCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  cartTotal: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },
  reviewBtn: {
    minWidth: 160,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minHeight: 100,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  cancelText: {
    fontSize: 16,
    color: colors.textSecondary,
    padding: spacing.sm,
  },
  saveBtn: {
    minWidth: 120,
  },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
