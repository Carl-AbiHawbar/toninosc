import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { ScreenHeader } from '@/components/ScreenHeader';
import { InvoiceCard } from '@/components/InvoiceCard';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function InvoicesScreen() {
  const router = useRouter();
  const { currentUser, invoices, markInvoicePaid } = useApp();

  const filteredInvoices =
    currentUser?.role === 'branch_manager'
      ? invoices.filter((i) => i.branchId === currentUser.branchId)
      : invoices;

  const isFinance = currentUser?.role === 'finance' || currentUser?.role === 'admin';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader
          title={currentUser?.role === 'branch_manager' ? 'My Bills' : 'Invoices'}
          subtitle={`${filteredInvoices.length} invoices`}
        />

        {filteredInvoices.length === 0 ? (
          <Text style={styles.empty}>No invoices found.</Text>
        ) : (
          filteredInvoices.map((invoice) => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              showActions={isFinance}
              onMarkPaid={() => markInvoicePaid(invoice.id)}
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
