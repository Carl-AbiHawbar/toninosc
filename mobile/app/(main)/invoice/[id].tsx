import { ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { ScreenHeader } from '@/components/ScreenHeader';
import { InvoiceCard } from '@/components/InvoiceCard';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { invoices, markInvoicePaid, currentUser } = useApp();

  const invoice = invoices.find((i) => i.id === id);
  const isFinance = currentUser?.role === 'finance' || currentUser?.role === 'admin';

  if (!invoice) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Invoice Not Found" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader title="Invoice Details" />
        <InvoiceCard
          invoice={invoice}
          showActions={isFinance}
          onMarkPaid={() => markInvoicePaid(invoice.id)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
});
