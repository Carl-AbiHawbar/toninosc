import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { mockBranches } from '@/data/mockBranches';
import { getStockItemById } from '@/data/mockStockItems';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AppCard } from '@/components/AppCard';
import { AppButton } from '@/components/AppButton';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { formatCurrency } from '@/utils/helpers';

export default function OrderReviewScreen() {
  const router = useRouter();
  const { currentUser, cart, cartNotes, getCartTotal, submitOrder, saveDraft, language, themeColors, t } = useApp();
  const isArabic = language === 'ar';

  const branch = mockBranches.find((b) => b.id === currentUser?.branchId);
  const total = getCartTotal();

  const handleSubmit = () => {
    const order = submitOrder();
    if (order) {
      router.replace('/(main)/my-orders');
    }
  };

  const handleSaveDraft = () => {
    const order = saveDraft();
    if (order) {
      router.replace('/(main)/my-orders');
    }
  };

  if (cart.length === 0) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
        <View style={styles.container}>
          <ScreenHeader title={t('reviewOrder')} />
          <Text style={[styles.empty, { color: themeColors.textSecondary }, isArabic && styles.rtlText]}>{t('emptyCart')}</Text>
          <AppButton title={t('goBack')} onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader title={t('reviewOrder')} subtitle={t('reviewSubtitle')} />

        <AppCard style={styles.branchCard}>
          <Text style={[styles.branchLabel, { color: themeColors.textSecondary }, isArabic && styles.rtlText]}>{t('deliveringTo')}</Text>
          <Text style={[styles.branchName, { color: themeColors.text }, isArabic && styles.rtlText]}>{branch?.name ?? t('yourBranch')}</Text>
          <Text style={[styles.branchAddress, { color: themeColors.textSecondary }]}>{branch?.address}</Text>
        </AppCard>

        <Text style={[styles.sectionTitle, { color: themeColors.text }, isArabic && styles.rtlText]}>{t('orderItems')}</Text>
        {cart.map((item) => {
          const stock = getStockItemById(item.stockItemId);
          if (!stock) return null;
          const lineTotal = stock.price * item.quantity;

          return (
            <AppCard key={item.stockItemId} style={styles.lineCard}>
              <View style={styles.lineRow}>
                <Text style={styles.lineEmoji}>{stock.imageEmoji}</Text>
                <View style={styles.lineInfo}>
                  <Text style={[styles.lineName, { color: themeColors.text }]}>{stock.name}</Text>
                  <Text style={[styles.lineDetail, { color: themeColors.textSecondary }]}>
                    {item.quantity} {stock.unit} × {formatCurrency(stock.price)}
                  </Text>
                  {item.note && <Text style={styles.lineNote}>📝 {item.note}</Text>}
                </View>
                <Text style={[styles.lineTotal, { color: themeColors.text }]}>{formatCurrency(lineTotal)}</Text>
              </View>
            </AppCard>
          );
        })}

        {cartNotes ? (
          <AppCard style={styles.notesCard}>
            <Text style={[styles.notesLabel, { color: themeColors.textSecondary }, isArabic && styles.rtlText]}>{t('orderNotes')}</Text>
            <Text style={[styles.notesText, { color: themeColors.text }]}>{cartNotes}</Text>
          </AppCard>
        ) : null}

        <AppCard style={styles.totalCard}>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: themeColors.text }]}>{t('estimatedTotal')}</Text>
            <Text style={[styles.totalValue, { color: themeColors.primary }]}>{formatCurrency(total)}</Text>
          </View>
        </AppCard>

        <View style={styles.buttons}>
          <AppButton title={t('submitOrder')} icon="✅" onPress={handleSubmit} />
          <AppButton title={t('saveDraft')} onPress={handleSaveDraft} variant="outline" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  empty: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  branchCard: {
    marginBottom: spacing.md,
  },
  branchLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  branchName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  branchAddress: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  lineCard: {
    marginBottom: spacing.sm,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lineEmoji: {
    fontSize: 32,
    marginRight: spacing.sm,
  },
  lineInfo: {
    flex: 1,
  },
  lineName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  lineDetail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  lineNote: {
    fontSize: 13,
    color: colors.warning,
    marginTop: 2,
  },
  lineTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  notesCard: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  notesLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 15,
    color: colors.text,
  },
  totalCard: {
    marginVertical: spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
  },
  buttons: {
    gap: spacing.md,
  },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
