import { View, Text, StyleSheet } from 'react-native';
import { OrderStatus, DeliveryStatus, PaymentStatus } from '@/types';
import { getStatusColor, orderStatusLabels } from '@/utils/helpers';
import { colors } from '@/theme/colors';
import { borderRadius, spacing } from '@/theme/spacing';

type StatusType = OrderStatus | DeliveryStatus | PaymentStatus | string;

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
}

const deliveryLabels: Record<DeliveryStatus, string> = {
  pending: 'Pending',
  loaded: 'Loaded',
  on_the_way: 'On the Way',
  delivered: 'Delivered',
  problem: 'Problem',
};

const paymentLabels: Record<PaymentStatus, string> = {
  unpaid: 'Unpaid',
  partial: 'Partial',
  paid: 'Paid',
  overdue: 'Overdue',
};

function getLabel(status: StatusType, label?: string): string {
  if (label) return label;
  if (status in orderStatusLabels) return orderStatusLabels[status as OrderStatus];
  if (status in deliveryLabels) return deliveryLabels[status as DeliveryStatus];
  if (status in paymentLabels) return paymentLabels[status as PaymentStatus];
  return String(status);
}

function getBadgeColor(status: StatusType): string {
  if (status in orderStatusLabels) return getStatusColor(status as OrderStatus);
  if (status === 'delivered' || status === 'paid') return colors.success;
  if (status === 'problem' || status === 'overdue') return colors.error;
  if (status === 'on_the_way' || status === 'loaded' || status === 'partial') return colors.warning;
  return colors.info;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const bgColor = getBadgeColor(status);
  const text = getLabel(status, label);

  return (
    <View style={[styles.badge, { backgroundColor: bgColor + '20', borderColor: bgColor }]}>
      <Text style={[styles.text, { color: bgColor }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
  },
});
