import { View, Text, StyleSheet } from 'react-native';
import { DeliveryStop } from '@/types';
import { AppCard } from './AppCard';
import { StatusBadge } from './StatusBadge';
import { AppButton } from './AppButton';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { formatCurrency } from '@/utils/helpers';
import { mockBranches } from '@/data/mockBranches';

interface DeliveryCardProps {
  stop: DeliveryStop;
  onStatusChange?: (status: DeliveryStop['status']) => void;
  onPress?: () => void;
  compact?: boolean;
}

export function DeliveryCard({ stop, onStatusChange, onPress, compact }: DeliveryCardProps) {
  const branch = mockBranches.find((b) => b.id === stop.branchId);

  return (
    <AppCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.stopBadge}>
          <Text style={styles.stopNum}>Stop {stop.stopNumber}</Text>
        </View>
        <StatusBadge status={stop.status} />
      </View>

      <Text style={styles.branchName}>{branch?.name ?? 'Branch'}</Text>
      <Text style={styles.address}>📍 {stop.address}</Text>
      <Text style={styles.phone}>📞 {stop.phone}</Text>

      <View style={styles.meta}>
        <Text style={styles.metaText}>📦 {stop.boxCount} boxes</Text>
        <Text style={styles.metaText}>💵 {formatCurrency(stop.invoiceTotal)}</Text>
      </View>

      {!compact && (
        <>
          <View style={styles.placeholderRow}>
            <AppButton title="WhatsApp" onPress={() => {}} variant="outline" style={styles.smallBtn} textStyle={styles.smallText} />
            <AppButton title="Map" onPress={() => {}} variant="outline" style={styles.smallBtn} textStyle={styles.smallText} />
          </View>

          {onStatusChange && (
            <View style={styles.statusButtons}>
              <AppButton title="Loaded" onPress={() => onStatusChange('loaded')} variant="secondary" style={styles.statusBtn} textStyle={styles.smallText} />
              <AppButton title="On the Way" onPress={() => onStatusChange('on_the_way')} variant="warning" style={styles.statusBtn} textStyle={styles.smallText} />
              <AppButton title="Delivered" onPress={() => onStatusChange('delivered')} variant="success" style={styles.statusBtn} textStyle={styles.smallText} />
              <AppButton title="Problem" onPress={() => onStatusChange('problem')} variant="danger" style={styles.statusBtn} textStyle={styles.smallText} />
            </View>
          )}
        </>
      )}

      {onPress && (
        <AppButton title="View Details" onPress={onPress} variant="primary" style={styles.detailBtn} />
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
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  stopBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  stopNum: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  branchName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  phone: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  meta: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.sm,
  },
  metaText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  placeholderRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  smallBtn: {
    flex: 1,
    minHeight: 40,
    paddingVertical: spacing.xs,
  },
  smallText: {
    fontSize: 14,
  },
  statusButtons: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  statusBtn: {
    minHeight: 44,
  },
  detailBtn: {
    marginTop: spacing.xs,
  },
});
