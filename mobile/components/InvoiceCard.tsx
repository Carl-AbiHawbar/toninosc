import { View, Text, StyleSheet } from 'react-native';
import { Invoice } from '@/types';
import { AppCard } from './AppCard';
import { StatusBadge } from './StatusBadge';
import { AppButton } from './AppButton';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { mockBranches } from '@/data/mockBranches';

interface InvoiceCardProps {
  invoice: Invoice;
  onPress?: () => void;
  onMarkPaid?: () => void;
  showActions?: boolean;
}

export function InvoiceCard({ invoice, onPress, onMarkPaid, showActions }: InvoiceCardProps) {
  const branch = mockBranches.find((b) => b.id === invoice.branchId);

  return (
    <AppCard style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>🥞 Tonino</Text>
          <Text style={styles.invoiceNum}>{invoice.invoiceNumber}</Text>
        </View>
        <StatusBadge status={invoice.paymentStatus} />
      </View>

      <Text style={styles.branch}>{branch?.name ?? 'Unknown Branch'}</Text>
      <Text style={styles.date}>{formatDate(invoice.date)}</Text>

      <View style={styles.divider} />

      {invoice.lines.map((line) => (
        <View key={line.id} style={styles.lineRow}>
          <View style={styles.lineInfo}>
            <Text style={styles.lineName}>{line.name}</Text>
            <Text style={styles.lineQty}>{line.quantity} {line.unit} × {formatCurrency(line.unitPrice)}</Text>
          </View>
          <Text style={styles.lineTotal}>{formatCurrency(line.total)}</Text>
        </View>
      ))}

      <View style={styles.divider} />

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Subtotal</Text>
        <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
      </View>
      {invoice.discount > 0 && (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Discount</Text>
          <Text style={styles.totalValue}>-{formatCurrency(invoice.discount)}</Text>
        </View>
      )}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Delivery Fee</Text>
        <Text style={styles.totalValue}>{formatCurrency(invoice.deliveryFee)}</Text>
      </View>
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Tax / VAT</Text>
        <Text style={styles.totalValue}>{formatCurrency(invoice.tax)}</Text>
      </View>
      <View style={[styles.totalRow, styles.grandTotal]}>
        <Text style={styles.grandLabel}>Grand Total</Text>
        <Text style={styles.grandValue}>{formatCurrency(invoice.grandTotal)}</Text>
      </View>

      {showActions && (
        <View style={styles.actions}>
          <AppButton title="Download PDF" onPress={() => {}} variant="outline" style={styles.actionBtn} textStyle={styles.actionText} />
          {invoice.paymentStatus !== 'paid' && onMarkPaid && (
            <AppButton title="Mark as Paid" onPress={onMarkPaid} variant="success" style={styles.actionBtn} textStyle={styles.actionText} />
          )}
          <AppButton title="Add Payment" onPress={() => {}} variant="secondary" style={styles.actionBtn} textStyle={styles.actionText} />
          <AppButton title="Credit Note" onPress={() => {}} variant="outline" style={styles.actionBtn} textStyle={styles.actionText} />
        </View>
      )}

      {onPress && !showActions && (
        <AppButton title="View Details" onPress={onPress} variant="outline" style={styles.viewBtn} textStyle={styles.actionText} />
      )}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  logo: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  invoiceNum: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  branch: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  date: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  lineInfo: {
    flex: 1,
  },
  lineName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  lineQty: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  lineTotal: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  totalValue: {
    fontSize: 14,
    color: colors.text,
  },
  grandTotal: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
  },
  grandLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  grandValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  actions: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  actionBtn: {
    minHeight: 44,
    paddingVertical: spacing.sm,
  },
  actionText: {
    fontSize: 15,
  },
  viewBtn: {
    marginTop: spacing.sm,
    minHeight: 44,
  },
});
