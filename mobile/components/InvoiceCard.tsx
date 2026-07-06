import { View, Text, StyleSheet } from 'react-native';
import { Invoice } from '@/types';
import { AppCard } from './AppCard';
import { StatusBadge } from './StatusBadge';
import { AppButton } from './AppButton';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { useApp } from '@/context/AppContext';
import { getStockItemName, getStockItemUnit } from '@/utils/stockLocalization';

interface InvoiceCardProps {
  invoice: Invoice;
  onPress?: () => void;
  onMarkPaid?: () => void;
  onAddPayment?: () => void;
  showActions?: boolean;
}

export function InvoiceCard({ invoice, onPress, onMarkPaid, onAddPayment, showActions }: InvoiceCardProps) {
  const { branches, language, themeColors, t } = useApp();
  const branch = branches.find((b) => b.id === invoice.branchId);
  const isArabic = language === 'ar';
  const isFreeSupply = Boolean(branch?.suppliesFree);
  const paidAmount = isFreeSupply ? invoice.grandTotal : invoice.paidAmount ?? (invoice.paymentStatus === 'paid' ? invoice.grandTotal : 0);
  const balance = isFreeSupply ? 0 : Math.max(0, invoice.grandTotal - paidAmount);

  return (
    <AppCard style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.logo, { color: themeColors.primary }]}>🥞 Tonino</Text>
          <Text style={[styles.invoiceNum, { color: themeColors.textSecondary }]}>{invoice.invoiceNumber}</Text>
        </View>
        <StatusBadge status={invoice.paymentStatus} />
      </View>

      <Text style={[styles.branch, { color: themeColors.text }]}>{branch?.name ?? 'Unknown Branch'}</Text>
      {isFreeSupply && (
        <Text style={[styles.paymentHint, { color: themeColors.success }]}>
          {isArabic ? 'فرع توريد مجاني - القيمة للتتبع فقط' : 'Free-supply branch - value tracked only'}
        </Text>
      )}
      <Text style={[styles.date, { color: themeColors.textSecondary }]}>{formatDate(invoice.date)}</Text>
      {invoice.dueDate && (
        <Text style={[styles.date, { color: balance > 0 ? themeColors.warning : themeColors.textSecondary }]}>
          {isArabic ? 'تاريخ الاستحقاق' : 'Due'}: {formatDate(invoice.dueDate)}
        </Text>
      )}

      <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

      {invoice.lines.map((line) => (
        <View key={line.id} style={styles.lineRow}>
          <View style={styles.lineInfo}>
            <Text style={[styles.lineName, { color: themeColors.text }, isArabic && styles.rtlText]}>
              {getStockItemName(line, language)}
            </Text>
            <Text style={[styles.lineQty, { color: themeColors.textSecondary }]}>
              {line.quantity} {getStockItemUnit(line, language)} x {formatCurrency(line.unitPrice)}
            </Text>
          </View>
          <Text style={[styles.lineTotal, { color: themeColors.text }]}>{formatCurrency(line.total)}</Text>
        </View>
      ))}

      <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

      <View style={styles.totalRow}>
        <Text style={[styles.totalLabel, { color: themeColors.textSecondary }]}>Subtotal</Text>
        <Text style={[styles.totalValue, { color: themeColors.text }]}>{formatCurrency(invoice.subtotal)}</Text>
      </View>
      {invoice.discount > 0 && (
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: themeColors.textSecondary }]}>Discount</Text>
          <Text style={[styles.totalValue, { color: themeColors.text }]}>-{formatCurrency(invoice.discount)}</Text>
        </View>
      )}
      <View style={styles.totalRow}>
        <Text style={[styles.totalLabel, { color: themeColors.textSecondary }]}>Delivery Fee</Text>
        <Text style={[styles.totalValue, { color: themeColors.text }]}>{formatCurrency(invoice.deliveryFee)}</Text>
      </View>
      <View style={styles.totalRow}>
        <Text style={[styles.totalLabel, { color: themeColors.textSecondary }]}>Tax / VAT</Text>
        <Text style={[styles.totalValue, { color: themeColors.text }]}>{formatCurrency(invoice.tax)}</Text>
      </View>
      <View style={[styles.totalRow, styles.grandTotal, { borderTopColor: themeColors.primary }]}>
        <Text style={[styles.grandLabel, { color: themeColors.text }]}>Grand Total</Text>
        <Text style={[styles.grandValue, { color: themeColors.primary }]}>{formatCurrency(invoice.grandTotal)}</Text>
      </View>
      <View style={styles.totalRow}>
        <Text style={[styles.totalLabel, { color: themeColors.textSecondary }]}>{isArabic ? 'مدفوع' : 'Paid'}</Text>
        <Text style={[styles.totalValue, { color: themeColors.success }]}>{formatCurrency(paidAmount)}</Text>
      </View>
      <View style={styles.totalRow}>
        <Text style={[styles.totalLabel, { color: themeColors.textSecondary }]}>{isArabic ? 'المتبقي' : 'Balance'}</Text>
        <Text style={[styles.totalValue, { color: balance > 0 ? themeColors.warning : themeColors.success }]}>
          {formatCurrency(balance)}
        </Text>
      </View>
      {invoice.lastPaymentDate && (
        <Text style={[styles.paymentHint, { color: themeColors.textSecondary }]}>
          {isArabic ? 'آخر دفعة' : 'Last payment'}: {formatDate(invoice.lastPaymentDate)}
        </Text>
      )}

      {showActions && (
        <View style={styles.actions}>
          {!isFreeSupply && invoice.paymentStatus !== 'paid' && onMarkPaid && (
            <AppButton title={t('markAsPaid')} onPress={onMarkPaid} variant="success" style={styles.actionBtn} textStyle={styles.actionText} />
          )}
          {!isFreeSupply && onAddPayment && (
            <AppButton title={t('addPayment')} onPress={onAddPayment} variant="secondary" style={styles.actionBtn} textStyle={styles.actionText} />
          )}
        </View>
      )}

      {onPress && !showActions && (
        <AppButton title={t('viewDetails')} onPress={onPress} variant="outline" style={styles.viewBtn} textStyle={styles.actionText} />
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
  paymentHint: {
    fontSize: 12,
    marginTop: 2,
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
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
