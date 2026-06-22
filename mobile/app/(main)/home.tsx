import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp, useDashboardStats } from '@/context/AppContext';
import { AppButton } from '@/components/AppButton';
import { DashboardCard } from '@/components/DashboardCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AppCard } from '@/components/AppCard';
import { roleLabelsByLanguage } from '@/i18n/translations';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { formatCurrency, getDateKey } from '@/utils/helpers';

export default function HomeScreen() {
  const router = useRouter();
  const {
    currentUser,
    logout,
    branches,
    deliveries,
    language,
    toggleLanguage,
    themeMode,
    themeColors,
    toggleTheme,
    offlineSync,
    getVisibleNotifications,
    markNotificationRead,
    t,
  } = useApp();
  const stats = useDashboardStats();
  const isArabic = language === 'ar';

  if (!currentUser) {
    router.replace('/');
    return null;
  }

  const branch = branches.find((b) => b.id === currentUser.branchId);
  const visibleNotifications = getVisibleNotifications().slice(0, 3);
  const queuedSync = offlineSync.filter((item) => item.status === 'queued').length;

  const renderBranchManagerHome = () => (
    <View style={styles.buttonStack}>
      <AppButton title={t('createNewOrder')} icon="🛒" onPress={() => router.push('/(main)/branch-order')} />
      <AppButton title={t('repeatLastOrder')} icon="🔄" onPress={() => router.push('/(main)/branch-order?repeat=true')} variant="secondary" />
      <AppButton title={t('myOrders')} icon="📋" onPress={() => router.push('/(main)/my-orders')} variant="outline" />
      <AppButton title={t('myBills')} icon="🧾" onPress={() => router.push('/(main)/invoices')} variant="outline" />
      <AppButton title={t('contactWarehouse')} icon="📞" onPress={() => router.push('/(main)/contact-warehouse')} variant="outline" />
    </View>
  );

  const renderAdminHome = () => (
    <>
      <View style={styles.dashboardGrid}>
        <DashboardCard title={t('todaysOrders')} value={stats.todayOrders} emoji="📦" accentColor={colors.primary} onPress={() => router.push('/(main)/admin-orders')} />
        <DashboardCard title={t('pendingApproval')} value={stats.pendingApproval} emoji="⏳" accentColor={colors.warning} onPress={() => router.push('/(main)/warehouse-orders')} />
        <DashboardCard title={t('lowStockAlerts')} value={stats.lowStockAlerts} emoji="⚠️" accentColor={colors.error} onPress={() => router.push('/(main)/alerts')} />
        <DashboardCard title={t('outForDelivery')} value={stats.outForDelivery} emoji="🚚" accentColor={colors.info} />
        <DashboardCard title={t('unpaidInvoices')} value={stats.unpaidInvoices} emoji="💳" accentColor={colors.warning} onPress={() => router.push('/(main)/invoices')} />
        <DashboardCard title={t('orderedThisMonth')} value={formatCurrency(stats.totalOrderedThisMonth)} emoji="📊" accentColor={colors.success} onPress={() => router.push('/(main)/reports')} />
      </View>
      <View style={styles.buttonStack}>
        <AppButton title={t('allBranchOrders')} onPress={() => router.push('/(main)/admin-orders')} />
        <AppButton title={t('allBranches')} onPress={() => router.push('/(main)/admin-branches')} variant="outline" />
        <AppButton title={t('inventoryOverview')} onPress={() => router.push('/(main)/inventory')} variant="outline" />
        <AppButton title={t('reports')} onPress={() => router.push('/(main)/reports')} variant="outline" />
        <AppButton title={t('alerts')} onPress={() => router.push('/(main)/alerts')} variant="outline" />
        <AppButton title={t('users')} onPress={() => router.push('/(main)/settings')} variant="outline" />
      </View>
    </>
  );

  const renderWarehouseHome = () => (
    <>
      <View style={styles.dashboardGrid}>
        <DashboardCard title={t('pendingApproval')} value={stats.pendingApproval} emoji="📋" onPress={() => router.push('/(main)/warehouse-orders')} />
        <DashboardCard title={t('preparing')} value={stats.preparingOrders} emoji="👨‍🍳" accentColor={colors.warning} onPress={() => router.push('/(main)/warehouse-orders')} />
        <DashboardCard title={t('lowStock')} value={stats.lowStockAlerts} emoji="📉" accentColor={colors.error} onPress={() => router.push('/(main)/inventory')} />
        <DashboardCard title={t('expiringSoon')} value={stats.expiringSoon} emoji="⏰" accentColor={colors.warning} onPress={() => router.push('/(main)/inventory')} />
      </View>
      <View style={styles.buttonStack}>
        <AppButton title={t('warehouseOrders')} onPress={() => router.push('/(main)/warehouse-orders')} />
        <AppButton title={t('inventory')} onPress={() => router.push('/(main)/inventory')} variant="outline" />
        <AppButton title={t('alerts')} onPress={() => router.push('/(main)/alerts')} variant="outline" />
      </View>
    </>
  );

  const renderDriverHome = () => {
    const today = getDateKey();
    const delivery = deliveries.find(
      (d) => d.driverId === currentUser.id && d.routeDate === today
    );
    const totalStops = delivery?.stops.length ?? 0;
    const completed = delivery?.stops.filter((s) => s.status === 'delivered').length ?? 0;

    return (
      <>
        <View style={[styles.driverStats, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Text style={[styles.driverStatBig, { color: themeColors.primary }]}>{totalStops}</Text>
          <Text style={[styles.driverStatLabel, { color: themeColors.text }, isArabic && styles.rtlText]}>{t('stopsToday')}</Text>
          <Text style={[styles.driverStatSub, { color: themeColors.textSecondary }, isArabic && styles.rtlText]}>
            {t('completedCount', { count: completed })}
          </Text>
        </View>
        <View style={styles.buttonStack}>
          <AppButton title={t('startRoute')} icon="🚚" onPress={() => router.push('/(main)/driver-deliveries')} />
          <AppButton title={t('todaysDeliveries')} onPress={() => router.push('/(main)/driver-deliveries')} variant="outline" />
        </View>
      </>
    );
  };

  const renderFinanceHome = () => (
    <>
      <View style={styles.dashboardGrid}>
        <DashboardCard title={t('unpaidInvoices')} value={stats.unpaidInvoices} emoji="💳" accentColor={colors.warning} onPress={() => router.push('/(main)/invoices')} />
        <DashboardCard title={t('paidThisMonth')} value={formatCurrency(stats.paidThisMonth)} emoji="✅" accentColor={colors.success} />
        <DashboardCard title={t('overdueBranches')} value={stats.overdueBranches} emoji="⚠️" accentColor={colors.error} />
        <DashboardCard title={t('invoicedThisMonth')} value={formatCurrency(stats.totalInvoicedThisMonth)} emoji="📊" />
      </View>
      <View style={styles.buttonStack}>
        <AppButton title={t('invoicesAndBills')} onPress={() => router.push('/(main)/invoices')} />
        <AppButton title={t('reports')} onPress={() => router.push('/(main)/reports')} variant="outline" />
        <AppButton title={t('alerts')} onPress={() => router.push('/(main)/alerts')} variant="outline" />
      </View>
    </>
  );

  const renderSupplierHome = () => (
    <View style={styles.buttonStack}>
      <AppButton title={t('suggestedPurchases')} onPress={() => router.push('/(main)/reports')} />
      <AppButton title={t('lowStockItems')} onPress={() => router.push('/(main)/inventory')} variant="outline" />
      <AppButton title={t('alerts')} onPress={() => router.push('/(main)/alerts')} variant="outline" />
    </View>
  );

  const renderHome = () => {
    switch (currentUser.role) {
      case 'branch_manager':
        return renderBranchManagerHome();
      case 'admin':
        return renderAdminHome();
      case 'warehouse':
        return renderWarehouseHome();
      case 'driver':
        return renderDriverHome();
      case 'finance':
        return renderFinanceHome();
      case 'supplier':
        return renderSupplierHome();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader
          title={t('hello', { name: currentUser.name.split(' ')[0] })}
          subtitle={
            currentUser.role === 'branch_manager' && branch
              ? branch.name
              : roleLabelsByLanguage[language][currentUser.role]
          }
          showBack={false}
          rightAction={{ label: t('logout'), onPress: () => { logout(); router.replace('/'); } }}
        />
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.languageButton, { backgroundColor: themeColors.card, borderColor: themeColors.border }]} onPress={toggleLanguage}>
            <Text style={[styles.languageText, { color: themeColors.primary }]}>
              {isArabic ? t('switchToEnglish') : t('switchToArabic')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.languageButton, { backgroundColor: themeColors.card, borderColor: themeColors.border }]} onPress={toggleTheme}>
            <Text style={[styles.languageText, { color: themeColors.primary }]}>
              {themeMode === 'dark' ? t('lightMode') : t('darkMode')}
            </Text>
          </TouchableOpacity>
        </View>
        {visibleNotifications.length > 0 && (
          <View style={styles.notificationStack}>
            {visibleNotifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                activeOpacity={0.82}
                onPress={() => {
                  markNotificationRead(notification.id);
                  if (notification.targetRoute) router.push(notification.targetRoute as never);
                }}
              >
                <AppCard style={[styles.notificationCard, !notification.read && { borderLeftColor: themeColors.primary, borderLeftWidth: 4 }]}>
                  <Text style={[styles.notificationTitle, { color: themeColors.text }, isArabic && styles.rtlText]}>
                    {notification.title}
                  </Text>
                  <Text style={[styles.notificationBody, { color: themeColors.textSecondary }, isArabic && styles.rtlText]}>
                    {notification.body}
                  </Text>
                </AppCard>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {queuedSync > 0 && (
          <AppCard style={styles.syncCard}>
            <Text style={[styles.syncText, { color: themeColors.warning }, isArabic && styles.rtlText]}>
              {isArabic ? `${queuedSync} عناصر بانتظار المزامنة` : `${queuedSync} items waiting to sync`}
            </Text>
          </AppCard>
        )}
        {renderHome()}
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
  buttonStack: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  languageButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  languageText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  dashboardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  driverStats: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notificationStack: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  notificationCard: {
    marginBottom: 0,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  notificationBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  syncCard: {
    marginBottom: spacing.md,
  },
  syncText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  driverStatBig: {
    fontSize: 64,
    fontWeight: '800',
    color: colors.primary,
  },
  driverStatLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  driverStatSub: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
