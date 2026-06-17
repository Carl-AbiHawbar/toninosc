import { ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { ScreenHeader } from '@/components/ScreenHeader';
import { InvoiceCard } from '@/components/InvoiceCard';
import { spacing } from '@/theme/spacing';

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { invoices, markInvoicePaid, addInvoicePayment, currentUser, language, themeColors, t } = useApp();

  const invoice = invoices.find((i) => i.id === id);
  const isFinance = currentUser?.role === 'finance' || currentUser?.role === 'admin';

  if (!invoice) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
        <ScreenHeader title={language === 'ar' ? 'الفاتورة غير موجودة' : 'Invoice Not Found'} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader title={language === 'ar' ? 'تفاصيل الفاتورة' : t('invoicesAndBills')} />
        <InvoiceCard
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
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
});
