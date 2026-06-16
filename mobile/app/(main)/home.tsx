import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp, useDashboardStats } from '@/context/AppContext';
import { AppButton } from '@/components/AppButton';
import { DashboardCard } from '@/components/DashboardCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { mockBranches } from '@/data/mockBranches';
import { roleLabels } from '@/data/mockUsers';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { formatCurrency } from '@/utils/helpers';

export default function HomeScreen() {
  const router = useRouter();
  const { currentUser, logout, deliveries } = useApp();
  const stats = useDashboardStats();

  if (!currentUser) {
    router.replace('/');
    return null;
  }

  const branch = mockBranches.find((b) => b.id === currentUser.branchId);

  const renderBranchManagerHome = () => (
    <View style={styles.buttonStack}>
      <AppButton title="Create New Order" icon="🛒" onPress={() => router.push('/(main)/branch-order')} />
      <AppButton title="Repeat Last Order" icon="🔄" onPress={() => router.push('/(main)/branch-order?repeat=true')} variant="secondary" />
      <AppButton title="My Orders" icon="📋" onPress={() => router.push('/(main)/my-orders')} variant="outline" />
      <AppButton title="My Bills" icon="🧾" onPress={() => router.push('/(main)/invoices')} variant="outline" />
      <AppButton title="Contact Warehouse" icon="📞" onPress={() => router.push('/(main)/contact-warehouse')} variant="outline" />
    </View>
  );

  const renderAdminHome = () => (
    <>
      <View style={styles.dashboardGrid}>
        <DashboardCard title="Today's Orders" value={stats.todayOrders} emoji="📦" accentColor={colors.primary} onPress={() => router.push('/(main)/admin-orders')} />
        <DashboardCard title="Pending Approval" value={stats.pendingApproval} emoji="⏳" accentColor={colors.warning} onPress={() => router.push('/(main)/warehouse-orders')} />
        <DashboardCard title="Low Stock Alerts" value={stats.lowStockAlerts} emoji="⚠️" accentColor={colors.error} onPress={() => router.push('/(main)/alerts')} />
        <DashboardCard title="Out for Delivery" value={stats.outForDelivery} emoji="🚚" accentColor={colors.info} />
        <DashboardCard title="Unpaid Invoices" value={stats.unpaidInvoices} emoji="💳" accentColor={colors.warning} onPress={() => router.push('/(main)/invoices')} />
        <DashboardCard title="Ordered This Month" value={formatCurrency(stats.totalOrderedThisMonth)} emoji="📊" accentColor={colors.success} onPress={() => router.push('/(main)/reports')} />
      </View>
      <View style={styles.buttonStack}>
        <AppButton title="All Branch Orders" onPress={() => router.push('/(main)/admin-orders')} />
        <AppButton title="All Branches" onPress={() => router.push('/(main)/admin-branches')} variant="outline" />
        <AppButton title="Inventory Overview" onPress={() => router.push('/(main)/inventory')} variant="outline" />
        <AppButton title="Reports" onPress={() => router.push('/(main)/reports')} variant="outline" />
        <AppButton title="Alerts" onPress={() => router.push('/(main)/alerts')} variant="outline" />
        <AppButton title="Users" onPress={() => router.push('/(main)/settings')} variant="outline" />
      </View>
    </>
  );

  const renderWarehouseHome = () => (
    <>
      <View style={styles.dashboardGrid}>
        <DashboardCard title="Pending Approval" value={stats.pendingApproval} emoji="📋" onPress={() => router.push('/(main)/warehouse-orders')} />
        <DashboardCard title="Preparing" value={stats.preparingOrders} emoji="👨‍🍳" accentColor={colors.warning} onPress={() => router.push('/(main)/warehouse-orders')} />
        <DashboardCard title="Low Stock" value={stats.lowStockAlerts} emoji="📉" accentColor={colors.error} onPress={() => router.push('/(main)/inventory')} />
        <DashboardCard title="Expiring Soon" value={stats.expiringSoon} emoji="⏰" accentColor={colors.warning} onPress={() => router.push('/(main)/inventory')} />
      </View>
      <View style={styles.buttonStack}>
        <AppButton title="Warehouse Orders" onPress={() => router.push('/(main)/warehouse-orders')} />
        <AppButton title="Inventory" onPress={() => router.push('/(main)/inventory')} variant="outline" />
        <AppButton title="Alerts" onPress={() => router.push('/(main)/alerts')} variant="outline" />
      </View>
    </>
  );

  const renderDriverHome = () => {
    const delivery = deliveries.find(
      (d) => d.driverId === currentUser.id && d.routeDate === '2026-06-16'
    );
    const totalStops = delivery?.stops.length ?? 0;
    const completed = delivery?.stops.filter((s) => s.status === 'delivered').length ?? 0;

    return (
      <>
        <View style={styles.driverStats}>
          <Text style={styles.driverStatBig}>{totalStops}</Text>
          <Text style={styles.driverStatLabel}>Stops Today</Text>
          <Text style={styles.driverStatSub}>{completed} completed</Text>
        </View>
        <View style={styles.buttonStack}>
          <AppButton title="Start Route" icon="🚚" onPress={() => router.push('/(main)/driver-deliveries')} />
          <AppButton title="Today's Deliveries" onPress={() => router.push('/(main)/driver-deliveries')} variant="outline" />
        </View>
      </>
    );
  };

  const renderFinanceHome = () => (
    <>
      <View style={styles.dashboardGrid}>
        <DashboardCard title="Unpaid Invoices" value={stats.unpaidInvoices} emoji="💳" accentColor={colors.warning} onPress={() => router.push('/(main)/invoices')} />
        <DashboardCard title="Paid This Month" value={formatCurrency(stats.paidThisMonth)} emoji="✅" accentColor={colors.success} />
        <DashboardCard title="Overdue Branches" value={stats.overdueBranches} emoji="⚠️" accentColor={colors.error} />
        <DashboardCard title="Invoiced This Month" value={formatCurrency(stats.totalInvoicedThisMonth)} emoji="📊" />
      </View>
      <View style={styles.buttonStack}>
        <AppButton title="Invoices & Bills" onPress={() => router.push('/(main)/invoices')} />
        <AppButton title="Reports" onPress={() => router.push('/(main)/reports')} variant="outline" />
        <AppButton title="Alerts" onPress={() => router.push('/(main)/alerts')} variant="outline" />
      </View>
    </>
  );

  const renderSupplierHome = () => (
    <View style={styles.buttonStack}>
      <AppButton title="Suggested Purchases" onPress={() => router.push('/(main)/reports')} />
      <AppButton title="Low Stock Items" onPress={() => router.push('/(main)/inventory')} variant="outline" />
      <AppButton title="Alerts" onPress={() => router.push('/(main)/alerts')} variant="outline" />
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
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader
          title={`Hello, ${currentUser.name.split(' ')[0]}!`}
          subtitle={
            currentUser.role === 'branch_manager' && branch
              ? branch.name
              : roleLabels[currentUser.role]
          }
          showBack={false}
          rightAction={{ label: 'Logout', onPress: () => { logout(); router.replace('/'); } }}
        />
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
});
