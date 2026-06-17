import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp, calculateOrderTotal } from '@/context/AppContext';
import { getOrderItemCount } from '@/data/mockOrders';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AppCard } from '@/components/AppCard';
import { StatusBadge } from '@/components/StatusBadge';
import { AppButton } from '@/components/AppButton';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { formatCurrency, formatDate } from '@/utils/helpers';

export default function MyOrdersScreen() {
  const router = useRouter();
  const { currentUser, orders, offlineSync, language, themeColors, t } = useApp();
  const isArabic = language === 'ar';

  const myOrders = orders
    .filter((o) => o.branchId === currentUser?.branchId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader title={t('myOrders')} subtitle={t('ordersCount', { count: myOrders.length })} />
        {offlineSync.some((item) => item.status === 'queued') && (
          <AppCard style={styles.syncCard}>
            <Text style={[styles.syncText, { color: themeColors.warning }, isArabic && styles.rtlText]}>
              {isArabic ? 'توجد مسودات محفوظة محليا بانتظار المزامنة.' : 'Some drafts are saved locally and waiting to sync.'}
            </Text>
          </AppCard>
        )}

        {myOrders.length === 0 ? (
          <Text style={[styles.empty, { color: themeColors.textSecondary }, isArabic && styles.rtlText]}>{t('noOrders')}</Text>
        ) : (
          myOrders.map((order) => (
            <AppCard key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={[styles.orderNum, { color: themeColors.text }]}>{order.orderNumber}</Text>
                <StatusBadge status={order.status} />
              </View>
              <Text style={[styles.orderDate, { color: themeColors.textSecondary }]}>{formatDate(order.createdAt)}</Text>
              <View style={styles.orderMeta}>
                <Text style={[styles.metaText, { color: themeColors.textSecondary }, isArabic && styles.rtlText]}>{t('itemsCount', { count: getOrderItemCount(order) })}</Text>
                <Text style={[styles.metaTotal, { color: themeColors.primary }]}>{formatCurrency(calculateOrderTotal(order))}</Text>
              </View>
              <AppButton
                title={t('viewDetails')}
                onPress={() => router.push(`/(main)/order-detail/${order.id}`)}
                variant="outline"
                style={styles.viewBtn}
                textStyle={styles.viewBtnText}
              />
            </AppCard>
          ))
        )}
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
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  orderCard: {
    marginBottom: spacing.md,
  },
  syncCard: {
    marginBottom: spacing.md,
  },
  syncText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  orderNum: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  orderDate: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  orderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  metaText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  metaTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  viewBtn: {
    minHeight: 44,
  },
  viewBtnText: {
    fontSize: 15,
  },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
