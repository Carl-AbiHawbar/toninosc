import { Alert, View, Text, StyleSheet } from 'react-native';
import { DeliveryStop } from '@/types';
import { AppCard } from './AppCard';
import { StatusBadge } from './StatusBadge';
import { AppButton } from './AppButton';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { formatCurrency } from '@/utils/helpers';
import { mockBranches } from '@/data/mockBranches';
import { useApp } from '@/context/AppContext';

interface DeliveryCardProps {
  stop: DeliveryStop;
  onStatusChange?: (status: DeliveryStop['status']) => void;
  onPress?: () => void;
  compact?: boolean;
}

export function DeliveryCard({ stop, onStatusChange, onPress, compact }: DeliveryCardProps) {
  const branch = mockBranches.find((b) => b.id === stop.branchId);
  const { themeColors, t } = useApp();
  const showDemoMessage = (action: string) => {
    Alert.alert(t('demoAction'), t('demoDelivery', { action }));
  };

  return (
    <AppCard style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.stopBadge, { backgroundColor: themeColors.primary }]}>
          <Text style={styles.stopNum}>Stop {stop.stopNumber}</Text>
        </View>
        <StatusBadge status={stop.status} />
      </View>

      <Text style={[styles.branchName, { color: themeColors.text }]}>{branch?.name ?? 'Branch'}</Text>
      <Text style={[styles.address, { color: themeColors.textSecondary }]}>📍 {stop.address}</Text>
      <Text style={[styles.phone, { color: themeColors.textSecondary }]}>📞 {stop.phone}</Text>

      <View style={styles.meta}>
        <Text style={[styles.metaText, { color: themeColors.text }]}>📦 {stop.boxCount} boxes</Text>
        <Text style={[styles.metaText, { color: themeColors.text }]}>💵 {formatCurrency(stop.invoiceTotal)}</Text>
      </View>

      {!compact && (
        <>
          <View style={styles.placeholderRow}>
            <AppButton title={t('whatsApp')} onPress={() => showDemoMessage(t('whatsApp'))} variant="outline" style={styles.smallBtn} textStyle={styles.smallText} />
            <AppButton title={t('map')} onPress={() => showDemoMessage(t('map'))} variant="outline" style={styles.smallBtn} textStyle={styles.smallText} />
          </View>

          {onStatusChange && (
            <View style={styles.statusButtons}>
              <AppButton title={t('loaded')} onPress={() => onStatusChange('loaded')} variant="secondary" style={styles.statusBtn} textStyle={styles.smallText} />
              <AppButton title={t('onTheWay')} onPress={() => onStatusChange('on_the_way')} variant="warning" style={styles.statusBtn} textStyle={styles.smallText} />
              <AppButton title={t('delivered')} onPress={() => onStatusChange('delivered')} variant="success" style={styles.statusBtn} textStyle={styles.smallText} />
              <AppButton title={t('problem')} onPress={() => onStatusChange('problem')} variant="danger" style={styles.statusBtn} textStyle={styles.smallText} />
            </View>
          )}
        </>
      )}

      {onPress && (
        <AppButton title={t('viewDetails')} onPress={onPress} variant="primary" style={styles.detailBtn} />
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
