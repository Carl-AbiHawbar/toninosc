import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { ScreenHeader } from '@/components/ScreenHeader';
import { InvoiceCard } from '@/components/InvoiceCard';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function InvoicesScreen() {
  const router = useRouter();
  const { currentUser, invoices, markInvoicePaid, addInvoicePayment, language, themeColors, t } = useApp();

  const filteredInvoices =
    currentUser?.role === 'branch_manager'
      ? invoices.filter((i) => i.branchId === currentUser.branchId)
      : invoices;

  const isFinance = currentUser?.role === 'finance' || currentUser?.role === 'admin';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader
          title={currentUser?.role === 'branch_manager' ? t('myBills') : t('invoicesAndBills')}
          subtitle={t('ordersCount', { count: filteredInvoices.length })}
        />

        {filteredInvoices.length === 0 ? (
          <Text style={[styles.empty, { color: themeColors.textSecondary }]}>
            {language === 'ar' ? 'لا توجد فواتير.' : currentUser?.role === 'branch_manager' ? 'No bills found.' : 'No invoices found.'}
          </Text>
        ) : (
          filteredInvoices.map((invoice) => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              showActions={isFinance}
              onMarkPaid={() => markInvoicePaid(invoice.id)}
              onAddPayment={() =>
                addInvoicePayment(
                  invoice.id,
                  Math.max(1, Math.min(100, invoice.grandTotal - (invoice.paidAmount ?? 0))),
                  'Demo payment'
                )
              }
              onPress={() => router.push(`/(main)/invoice/${invoice.id}`)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  empty: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl },
});
