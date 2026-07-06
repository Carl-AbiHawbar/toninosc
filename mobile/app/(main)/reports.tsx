import { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { AppCard } from '@/components/AppCard';
import { DashboardCard } from '@/components/DashboardCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SearchBar } from '@/components/SearchBar';
import { calculateOrderTotal, useApp } from '@/context/AppContext';
import { BranchOrder, StockItem } from '@/types';
import { spacing } from '@/theme/spacing';
import { formatCurrency, formatDate, getMonthKey } from '@/utils/helpers';
import { getStockItemName, getStockItemUnit } from '@/utils/stockLocalization';

type BranchTotals = {
  id: string;
  name: string;
  city: string;
  monthQty: number;
  monthValue: number;
  yearQty: number;
  yearValue: number;
  yearOrders: number;
};

type MonthDetail = {
  key: string;
  label: string;
  orderCount: number;
  qty: number;
  value: number;
  orders: BranchOrder[];
};

type ItemTotal = {
  id: string;
  name: string;
  unit: string;
  qty: number;
  value: number;
};

function getOrderQty(order: BranchOrder) {
  return order.lines.reduce((sum, line) => sum + line.quantity, 0);
}

function getItemTotals(orders: BranchOrder[], stockItems: StockItem[], language: 'en' | 'ar') {
  const itemMap = new Map<string, ItemTotal>();

  orders.forEach((order) => {
    order.lines.forEach((line) => {
      const stock = stockItems.find((item) => item.id === line.stockItemId);
      const current = itemMap.get(line.stockItemId) ?? {
        id: line.stockItemId,
        name: getStockItemName(stock, language),
        unit: getStockItemUnit(stock, language) || 'unit',
        qty: 0,
        value: 0,
      };

      current.qty += line.quantity;
      current.value += line.quantity * line.unitPrice;
      itemMap.set(line.stockItemId, current);
    });
  });

  return [...itemMap.values()].sort((a, b) => b.qty - a.qty);
}

export default function ReportsScreen() {
  const { orders, branches, stockItems, language, themeColors, t } = useApp();
  const [search, setSearch] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);
  const isArabic = language === 'ar';
  const now = new Date();
  const monthKey = getMonthKey(now);
  const yearKey = String(now.getFullYear());
  const locale = isArabic ? 'ar-LB' : 'en-GB';
  const monthLabel = now.toLocaleDateString(locale, { month: 'long', year: 'numeric' });

  const report = useMemo(() => {
    const activeOrders = orders.filter((order) => order.status !== 'draft');
    const branchTotals: BranchTotals[] = branches.map((branch) => {
      const branchOrders = activeOrders.filter((order) => order.branchId === branch.id);
      const monthOrders = branchOrders.filter((order) => order.createdAt.startsWith(monthKey));
      const yearOrders = branchOrders.filter((order) => order.createdAt.startsWith(yearKey));

      return {
        id: branch.id,
        name: branch.name,
        city: branch.city,
        monthQty: monthOrders.reduce((sum, order) => sum + getOrderQty(order), 0),
        monthValue: monthOrders.reduce((sum, order) => sum + calculateOrderTotal(order), 0),
        yearQty: yearOrders.reduce((sum, order) => sum + getOrderQty(order), 0),
        yearValue: yearOrders.reduce((sum, order) => sum + calculateOrderTotal(order), 0),
        yearOrders: yearOrders.length,
      };
    });

    const allTotals = branchTotals.reduce(
      (totals, branch) => ({
        monthQty: totals.monthQty + branch.monthQty,
        monthValue: totals.monthValue + branch.monthValue,
        yearQty: totals.yearQty + branch.yearQty,
        yearValue: totals.yearValue + branch.yearValue,
        yearOrders: totals.yearOrders + branch.yearOrders,
      }),
      { monthQty: 0, monthValue: 0, yearQty: 0, yearValue: 0, yearOrders: 0 }
    );

    return {
      activeOrders,
      branchTotals,
      allTotals,
      topItems: getItemTotals(
        activeOrders.filter((order) => order.createdAt.startsWith(monthKey)),
        stockItems,
        language
      ).slice(0, 6),
    };
  }, [branches, language, monthKey, orders, stockItems, yearKey]);

  const selectedBranch = report.branchTotals.find((branch) => branch.id === selectedBranchId);

  const selectedBranchDetails = useMemo(() => {
    if (!selectedBranchId) return null;

    const branchYearOrders = report.activeOrders.filter(
      (order) => order.branchId === selectedBranchId && order.createdAt.startsWith(yearKey)
    );

    const months: MonthDetail[] = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(Number(yearKey), index, 1);
      const key = `${yearKey}-${String(index + 1).padStart(2, '0')}`;
      const monthOrders = branchYearOrders
        .filter((order) => order.createdAt.startsWith(key))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return {
        key,
        label: date.toLocaleDateString(locale, { month: 'long' }),
        orderCount: monthOrders.length,
        qty: monthOrders.reduce((sum, order) => sum + getOrderQty(order), 0),
        value: monthOrders.reduce((sum, order) => sum + calculateOrderTotal(order), 0),
        orders: monthOrders,
      };
    });

    return {
      months,
      topItems: getItemTotals(branchYearOrders, stockItems, language).slice(0, 10),
    };
  }, [language, locale, report.activeOrders, selectedBranchId, stockItems, yearKey]);

  const selectedMonth = selectedBranchDetails?.months.find((month) => month.key === selectedMonthKey);

  const filteredBranches = report.branchTotals.filter((branch) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return `${branch.name} ${branch.city}`.toLowerCase().includes(query);
  });

  const backToBranches = () => {
    setSelectedMonthKey(null);
    setSelectedBranchId(null);
  };

  if (selectedBranch && selectedBranchDetails) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
        <ScrollView contentContainerStyle={styles.container}>
          <ScreenHeader
            title={selectedBranch.name}
            subtitle={selectedMonth ? `${selectedMonth.label} ${yearKey}` : `${yearKey} order details`}
          />

          <AppButton
            title={isArabic ? 'كل الفروع' : 'Back to all branches'}
            onPress={backToBranches}
            variant="outline"
            style={styles.backButton}
            textStyle={styles.backButtonText}
          />
          {selectedMonth && (
            <AppButton
              title={isArabic ? 'رجوع إلى الأشهر' : 'Back to monthly breakdown'}
              onPress={() => setSelectedMonthKey(null)}
              variant="outline"
              style={styles.backButton}
              textStyle={styles.backButtonText}
            />
          )}

          <View style={styles.dashboardGrid}>
            <DashboardCard title={isArabic ? 'طلبات السنة' : 'Year orders'} value={selectedBranch.yearOrders} accentColor={themeColors.info} />
            <DashboardCard title={isArabic ? 'مواد السنة' : 'Year items'} value={selectedBranch.yearQty} accentColor={themeColors.primary} />
            <DashboardCard title={isArabic ? 'قيمة السنة' : 'Year value'} value={formatCurrency(selectedBranch.yearValue)} accentColor={themeColors.success} />
            <DashboardCard title={isArabic ? 'قيمة الشهر الحالي' : 'Current month value'} value={formatCurrency(selectedBranch.monthValue)} accentColor={themeColors.warning} />
          </View>

          {selectedMonth ? (
            <>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                {isArabic ? 'كل طلبات الشهر' : 'All orders this month'}
              </Text>
              {selectedMonth.orders.length === 0 ? (
                <AppCard>
                  <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
                    {isArabic ? 'لا توجد طلبات في هذا الشهر.' : 'No orders in this month.'}
                  </Text>
                </AppCard>
              ) : (
                selectedMonth.orders.map((order) => (
                  <OrderHistoryCard key={order.id} order={order} stockItems={stockItems} />
                ))
              )}
            </>
          ) : (
            <>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                {isArabic ? 'تفصيل كل شهر' : 'Monthly breakdown'}
              </Text>
              {selectedBranchDetails.months.map((month) => (
                <TouchableOpacity
                  key={month.key}
                  activeOpacity={0.82}
                  disabled={month.orderCount === 0}
                  onPress={() => setSelectedMonthKey(month.key)}
                >
                  <AppCard style={[styles.monthCard, month.orderCount === 0 && styles.disabledCard]}>
                    <View style={styles.monthHeader}>
                      <Text style={[styles.monthName, { color: themeColors.text }]}>{month.label}</Text>
                      <Text style={[styles.monthValue, { color: themeColors.primary }]}>{formatCurrency(month.value)}</Text>
                    </View>
                    <View style={styles.monthMetaRow}>
                      <Text style={[styles.monthMeta, { color: themeColors.textSecondary }]}>
                        {isArabic ? 'الطلبات' : 'Orders'}: {month.orderCount}
                      </Text>
                      <Text style={[styles.monthMeta, { color: themeColors.textSecondary }]}>
                        {isArabic ? 'المواد' : 'Items'}: {month.qty}
                      </Text>
                    </View>
                    {month.orderCount > 0 && (
                      <Text style={[styles.openText, { color: themeColors.primary }]}>
                        {isArabic ? 'فتح تاريخ الشهر' : 'Open month history'}
                      </Text>
                    )}
                  </AppCard>
                </TouchableOpacity>
              ))}

              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                {isArabic ? 'المواد المطلوبة خلال السنة' : 'Items ordered this year'}
              </Text>
              {selectedBranchDetails.topItems.length === 0 ? (
                <AppCard>
                  <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
                    {isArabic ? 'لا توجد طلبات لهذه السنة.' : 'No orders for this year.'}
                  </Text>
                </AppCard>
              ) : (
                selectedBranchDetails.topItems.map((item, index) => (
                  <ItemTotalRow key={item.id} item={item} index={index} />
                ))
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader title={t('reports')} subtitle={isArabic ? 'إجمالي الطلبات حسب الفرع' : 'Order totals by branch'} />

        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
          {isArabic ? 'كل الفروع' : 'All branches'}
        </Text>
        <View style={styles.dashboardGrid}>
          <DashboardCard title={isArabic ? `مواد ${monthLabel}` : `${monthLabel} items`} value={report.allTotals.monthQty} accentColor={themeColors.primary} />
          <DashboardCard title={isArabic ? `قيمة ${monthLabel}` : `${monthLabel} value`} value={formatCurrency(report.allTotals.monthValue)} accentColor={themeColors.success} />
          <DashboardCard title={isArabic ? `طلبات سنة ${yearKey}` : `${yearKey} orders`} value={report.allTotals.yearOrders} accentColor={themeColors.info} />
          <DashboardCard title={isArabic ? `قيمة سنة ${yearKey}` : `${yearKey} value`} value={formatCurrency(report.allTotals.yearValue)} accentColor={themeColors.warning} />
        </View>

        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
          {isArabic ? 'ابحث واختر فرعا' : 'Search and open a branch'}
        </Text>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={isArabic ? 'ابحث عن فرع...' : 'Search branches...'}
        />

        {filteredBranches.length === 0 ? (
          <AppCard>
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
              {isArabic ? 'لا توجد فروع بهذا البحث.' : 'No branches match your search.'}
            </Text>
          </AppCard>
        ) : (
          filteredBranches.map((branch) => (
            <TouchableOpacity
              key={branch.id}
              activeOpacity={0.82}
              onPress={() => {
                setSelectedMonthKey(null);
                setSelectedBranchId(branch.id);
              }}
            >
              <AppCard style={styles.branchCard}>
                <View style={styles.branchHeader}>
                  <View style={styles.branchTitleBlock}>
                    <Text style={[styles.branchName, { color: themeColors.text }]}>{branch.name}</Text>
                    <Text style={[styles.branchCity, { color: themeColors.textSecondary }]}>{branch.city}</Text>
                  </View>
                  <Text style={[styles.openText, { color: themeColors.primary }]}>
                    {isArabic ? 'فتح' : 'Open'}
                  </Text>
                </View>

                <View style={styles.totalGrid}>
                  <TotalCell label={isArabic ? 'مواد الشهر' : 'Month items'} value={branch.monthQty} />
                  <TotalCell label={isArabic ? 'قيمة الشهر' : 'Month value'} value={formatCurrency(branch.monthValue)} accent />
                  <TotalCell label={isArabic ? 'طلبات السنة' : 'Year orders'} value={branch.yearOrders} />
                  <TotalCell label={isArabic ? 'قيمة السنة' : 'Year value'} value={formatCurrency(branch.yearValue)} accent />
                </View>
              </AppCard>
            </TouchableOpacity>
          ))
        )}

        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
          {isArabic ? `أكثر المواد طلبا في ${monthLabel}` : `Top ordered items in ${monthLabel}`}
        </Text>
        {report.topItems.length === 0 ? (
          <AppCard>
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
              {isArabic ? 'لا توجد طلبات لهذا الشهر.' : 'No orders for this month.'}
            </Text>
          </AppCard>
        ) : (
          report.topItems.map((item, index) => (
            <ItemTotalRow key={item.id} item={item} index={index} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function TotalCell({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) {
  const { themeColors } = useApp();
  return (
    <View style={styles.totalCell}>
      <Text style={[styles.totalLabel, { color: themeColors.textSecondary }]}>{label}</Text>
      <Text style={[styles.totalValue, { color: accent ? themeColors.primary : themeColors.text }]}>{value}</Text>
    </View>
  );
}

function OrderHistoryCard({ order, stockItems }: { order: BranchOrder; stockItems: StockItem[] }) {
  const { language, themeColors } = useApp();
  const isArabic = language === 'ar';

  return (
    <AppCard style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderTitleBlock}>
          <Text style={[styles.orderNumber, { color: themeColors.text }]}>{order.orderNumber}</Text>
          <Text style={[styles.orderDate, { color: themeColors.textSecondary }]}>{formatDate(order.createdAt)}</Text>
        </View>
        <Text style={[styles.orderTotal, { color: themeColors.primary }]}>{formatCurrency(calculateOrderTotal(order))}</Text>
      </View>

      {order.lines.map((line) => {
        const stock = stockItems.find((item) => item.id === line.stockItemId);
        return (
          <View key={line.id} style={styles.orderLineRow}>
            <Text style={[styles.orderLineName, { color: themeColors.text }, isArabic && styles.rtlText]}>
              {stock ? getStockItemName(stock, language) : line.stockItemId}
            </Text>
            <Text style={[styles.orderLineQty, { color: themeColors.textSecondary }]}>
              {line.quantity} {getStockItemUnit(stock, language)} x {formatCurrency(line.unitPrice)}
            </Text>
          </View>
        );
      })}

      {order.notes ? (
        <Text style={[styles.orderNote, { color: themeColors.textSecondary }]}>{order.notes}</Text>
      ) : null}
      <Text style={[styles.orderStatus, { color: themeColors.textSecondary }]}>
        {isArabic ? 'الحالة' : 'Status'}: {order.status.replace(/_/g, ' ')}
      </Text>
    </AppCard>
  );
}

function ItemTotalRow({ item, index }: { item: ItemTotal; index: number }) {
  const { themeColors } = useApp();

  return (
    <AppCard style={styles.itemCard}>
      <View style={styles.itemRow}>
        <Text style={[styles.rank, { color: themeColors.primary }]}>{index + 1}</Text>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, { color: themeColors.text }]}>{item.name}</Text>
          <Text style={[styles.itemMeta, { color: themeColors.textSecondary }]}>
            {item.qty} {item.unit}
          </Text>
        </View>
        <Text style={[styles.itemValue, { color: themeColors.text }]}>{formatCurrency(item.value)}</Text>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  dashboardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  backButton: { minHeight: 44, marginBottom: spacing.sm },
  backButtonText: { fontSize: 14 },
  branchCard: { marginBottom: spacing.sm },
  branchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  branchTitleBlock: { flex: 1 },
  branchName: { fontSize: 17, fontWeight: '800' },
  branchCity: { fontSize: 13, marginTop: 2 },
  openText: { fontSize: 13, fontWeight: '800', marginTop: spacing.sm },
  totalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.sm,
  },
  totalCell: {
    width: '50%',
    paddingRight: spacing.sm,
  },
  totalLabel: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  totalValue: { fontSize: 17, fontWeight: '800' },
  monthCard: { marginBottom: spacing.sm },
  disabledCard: { opacity: 0.55 },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  monthName: { flex: 1, fontSize: 16, fontWeight: '800' },
  monthValue: { fontSize: 15, fontWeight: '800' },
  monthMetaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  monthMeta: { fontSize: 13, fontWeight: '600' },
  orderCard: { marginBottom: spacing.sm },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  orderTitleBlock: { flex: 1 },
  orderNumber: { fontSize: 16, fontWeight: '800' },
  orderDate: { fontSize: 13, marginTop: 2 },
  orderTotal: { fontSize: 15, fontWeight: '800' },
  orderLineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: 3,
  },
  orderLineName: { flex: 1, fontSize: 14, fontWeight: '600' },
  orderLineQty: { fontSize: 13, fontWeight: '600' },
  orderNote: { fontSize: 13, marginTop: spacing.sm },
  orderStatus: { fontSize: 12, fontWeight: '700', marginTop: spacing.sm },
  itemCard: { marginBottom: spacing.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rank: { fontSize: 18, fontWeight: '900', width: 26, textAlign: 'center' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '700' },
  itemMeta: { fontSize: 13, marginTop: 2 },
  itemValue: { fontSize: 14, fontWeight: '800' },
  emptyText: { fontSize: 15, textAlign: 'center' },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
