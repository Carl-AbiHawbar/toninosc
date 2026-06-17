import { useMemo, useState } from 'react';
import { Alert, View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AppCard } from '@/components/AppCard';
import { DashboardCard } from '@/components/DashboardCard';
import { SearchBar } from '@/components/SearchBar';
import { AppButton } from '@/components/AppButton';
import { useApp, calculateOrderTotal } from '@/context/AppContext';
import { mockBranches } from '@/data/mockBranches';
import { getStockItemById } from '@/data/mockStockItems';
import { spacing } from '@/theme/spacing';
import { formatCurrency, getMonthKey } from '@/utils/helpers';

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
};

type ItemTotal = {
  id: string;
  name: string;
  unit: string;
  qty: number;
  value: number;
};

function getOrderQty(order: { lines: { quantity: number }[] }) {
  return order.lines.reduce((sum, line) => sum + line.quantity, 0);
}

function getItemTotals(
  orders: { lines: { stockItemId: string; quantity: number; unitPrice: number }[] }[]
) {
  const itemMap = new Map<string, ItemTotal>();

  orders.forEach((order) => {
    order.lines.forEach((line) => {
      const stock = getStockItemById(line.stockItemId);
      const current = itemMap.get(line.stockItemId) ?? {
        id: line.stockItemId,
        name: stock?.name ?? 'Unknown item',
        unit: stock?.unit ?? 'unit',
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
  const { orders, language, themeColors, t } = useApp();
  const [search, setSearch] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const isArabic = language === 'ar';
  const now = new Date();
  const monthKey = getMonthKey(now);
  const yearKey = String(now.getFullYear());
  const locale = isArabic ? 'ar-LB' : 'en-GB';
  const monthLabel = now.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  const showExportDemo = (type: 'PDF' | 'Excel') => {
    Alert.alert(
      isArabic ? 'تصدير التقرير' : 'Export report',
      isArabic
        ? `سيتم إنشاء ملف ${type} من هذه الأرقام عند ربط النظام بالخلفية.`
        : `${type} export will generate from these totals once the backend is connected.`
    );
  };

  const report = useMemo(() => {
    const activeOrders = orders.filter((order) => order.status !== 'draft');
    const branchTotals: BranchTotals[] = mockBranches.map((branch) => {
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

    const topItems = getItemTotals(activeOrders.filter((order) => order.createdAt.startsWith(monthKey))).slice(0, 6);

    return { activeOrders, branchTotals, allTotals, topItems };
  }, [monthKey, orders, yearKey]);

  const selectedBranch = report.branchTotals.find((branch) => branch.id === selectedBranchId);

  const selectedBranchDetails = useMemo(() => {
    if (!selectedBranchId) return null;

    const branchYearOrders = report.activeOrders.filter(
      (order) => order.branchId === selectedBranchId && order.createdAt.startsWith(yearKey)
    );

    const months: MonthDetail[] = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(Number(yearKey), index, 1);
      const key = `${yearKey}-${String(index + 1).padStart(2, '0')}`;
      const monthOrders = branchYearOrders.filter((order) => order.createdAt.startsWith(key));

      return {
        key,
        label: date.toLocaleDateString(locale, { month: 'long' }),
        orderCount: monthOrders.length,
        qty: monthOrders.reduce((sum, order) => sum + getOrderQty(order), 0),
        value: monthOrders.reduce((sum, order) => sum + calculateOrderTotal(order), 0),
      };
    });

    return {
      months,
      topItems: getItemTotals(branchYearOrders).slice(0, 10),
    };
  }, [locale, report.activeOrders, selectedBranchId, yearKey]);

  const filteredBranches = report.branchTotals.filter((branch) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return `${branch.name} ${branch.city}`.toLowerCase().includes(query);
  });

  if (selectedBranch && selectedBranchDetails) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
        <ScrollView contentContainerStyle={styles.container}>
          <ScreenHeader
            title={selectedBranch.name}
            subtitle={isArabic ? `تفاصيل طلبات سنة ${yearKey}` : `${yearKey} order details`}
          />
          <AppButton
            title={isArabic ? 'رجوع إلى كل الفروع' : 'Back to all branches'}
            onPress={() => setSelectedBranchId(null)}
            variant="outline"
            style={styles.backButton}
            textStyle={styles.backButtonText}
          />
          <View style={styles.exportRow}>
            <AppButton title="PDF" onPress={() => showExportDemo('PDF')} variant="outline" style={styles.exportButton} textStyle={styles.exportText} />
            <AppButton title="Excel" onPress={() => showExportDemo('Excel')} variant="outline" style={styles.exportButton} textStyle={styles.exportText} />
          </View>

          <View style={styles.dashboardGrid}>
            <DashboardCard
              title={isArabic ? 'طلبات السنة' : 'Year orders'}
              value={selectedBranch.yearOrders}
              accentColor={themeColors.info}
            />
            <DashboardCard
              title={isArabic ? 'مواد السنة' : 'Year items'}
              value={selectedBranch.yearQty}
              accentColor={themeColors.primary}
            />
            <DashboardCard
              title={isArabic ? 'قيمة السنة' : 'Year value'}
              value={formatCurrency(selectedBranch.yearValue)}
              accentColor={themeColors.success}
            />
            <DashboardCard
              title={isArabic ? 'قيمة الشهر الحالي' : 'Current month value'}
              value={formatCurrency(selectedBranch.monthValue)}
              accentColor={themeColors.warning}
            />
          </View>

          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            {isArabic ? 'تفصيل كل شهر' : 'Monthly Breakdown'}
          </Text>
          {selectedBranchDetails.months.map((month) => (
            <AppCard key={month.key} style={styles.monthCard}>
              <View style={styles.monthHeader}>
                <Text style={[styles.monthName, { color: themeColors.text }]}>{month.label}</Text>
                <Text style={[styles.monthValue, { color: themeColors.primary }]}>
                  {formatCurrency(month.value)}
                </Text>
              </View>
              <View style={styles.monthMetaRow}>
                <Text style={[styles.monthMeta, { color: themeColors.textSecondary }]}>
                  {isArabic ? 'الطلبات' : 'Orders'}: {month.orderCount}
                </Text>
                <Text style={[styles.monthMeta, { color: themeColors.textSecondary }]}>
                  {isArabic ? 'المواد' : 'Items'}: {month.qty}
                </Text>
              </View>
            </AppCard>
          ))}

          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            {isArabic ? 'المواد المطلوبة خلال السنة' : 'Items Ordered This Year'}
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
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader
          title={t('reports')}
          subtitle={isArabic ? 'إجمالي الطلبات حسب الفرع' : 'Order totals by branch'}
        />

        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
          {isArabic ? 'كل الفروع' : 'All Branches'}
        </Text>
        <View style={styles.dashboardGrid}>
          <DashboardCard
            title={isArabic ? `مواد ${monthLabel}` : `${monthLabel} items`}
            value={report.allTotals.monthQty}
            accentColor={themeColors.primary}
          />
          <DashboardCard
            title={isArabic ? `قيمة ${monthLabel}` : `${monthLabel} value`}
            value={formatCurrency(report.allTotals.monthValue)}
            accentColor={themeColors.success}
          />
          <DashboardCard
            title={isArabic ? `طلبات سنة ${yearKey}` : `${yearKey} orders`}
            value={report.allTotals.yearOrders}
            accentColor={themeColors.info}
          />
          <DashboardCard
            title={isArabic ? `قيمة سنة ${yearKey}` : `${yearKey} value`}
            value={formatCurrency(report.allTotals.yearValue)}
            accentColor={themeColors.warning}
          />
        </View>
        <View style={styles.exportRow}>
          <AppButton title="Export PDF" onPress={() => showExportDemo('PDF')} variant="outline" style={styles.exportButton} textStyle={styles.exportText} />
          <AppButton title="Export Excel" onPress={() => showExportDemo('Excel')} variant="outline" style={styles.exportButton} textStyle={styles.exportText} />
        </View>

        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
          {isArabic ? 'ابحث واختر فرعا' : 'Search and Open a Branch'}
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
              onPress={() => setSelectedBranchId(branch.id)}
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
                  <View style={styles.totalCell}>
                    <Text style={[styles.totalLabel, { color: themeColors.textSecondary }]}>
                      {isArabic ? 'مواد الشهر' : 'Month items'}
                    </Text>
                    <Text style={[styles.totalValue, { color: themeColors.text }]}>{branch.monthQty}</Text>
                  </View>
                  <View style={styles.totalCell}>
                    <Text style={[styles.totalLabel, { color: themeColors.textSecondary }]}>
                      {isArabic ? 'قيمة الشهر' : 'Month value'}
                    </Text>
                    <Text style={[styles.totalValue, { color: themeColors.primary }]}>
                      {formatCurrency(branch.monthValue)}
                    </Text>
                  </View>
                  <View style={styles.totalCell}>
                    <Text style={[styles.totalLabel, { color: themeColors.textSecondary }]}>
                      {isArabic ? 'طلبات السنة' : 'Year orders'}
                    </Text>
                    <Text style={[styles.totalValue, { color: themeColors.text }]}>{branch.yearOrders}</Text>
                  </View>
                  <View style={styles.totalCell}>
                    <Text style={[styles.totalLabel, { color: themeColors.textSecondary }]}>
                      {isArabic ? 'قيمة السنة' : 'Year value'}
                    </Text>
                    <Text style={[styles.totalValue, { color: themeColors.primary }]}>
                      {formatCurrency(branch.yearValue)}
                    </Text>
                  </View>
                </View>
              </AppCard>
            </TouchableOpacity>
          ))
        )}

        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
          {isArabic ? `أكثر المواد طلبا في ${monthLabel}` : `Top Ordered Items in ${monthLabel}`}
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
        <Text style={[styles.itemValue, { color: themeColors.text }]}>
          {formatCurrency(item.value)}
        </Text>
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
  backButton: { minHeight: 44, marginBottom: spacing.md },
  backButtonText: { fontSize: 14 },
  exportRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  exportButton: {
    flex: 1,
    minHeight: 44,
    paddingVertical: spacing.sm,
  },
  exportText: { fontSize: 14 },
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
  openText: { fontSize: 14, fontWeight: '800' },
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
  itemCard: { marginBottom: spacing.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rank: { fontSize: 18, fontWeight: '900', width: 26, textAlign: 'center' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '700' },
  itemMeta: { fontSize: 13, marginTop: 2 },
  itemValue: { fontSize: 14, fontWeight: '800' },
  emptyText: { fontSize: 15, textAlign: 'center' },
});
