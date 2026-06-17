import { View, Text, StyleSheet } from 'react-native';
import { DeliveryStatus, OrderStatus, PaymentStatus } from '@/types';
import { getStatusColor } from '@/utils/helpers';
import { useApp } from '@/context/AppContext';
import {
  deliveryStatusLabelsByLanguage,
  orderStatusLabelsByLanguage,
  paymentStatusLabelsByLanguage,
} from '@/i18n/translations';
import { borderRadius, spacing } from '@/theme/spacing';

type StatusType = OrderStatus | DeliveryStatus | PaymentStatus | string;

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const { language, themeColors } = useApp();
  const bgColor =
    status in orderStatusLabelsByLanguage.en
      ? getStatusColor(status as OrderStatus, themeColors)
      : status === 'delivered' || status === 'paid'
        ? themeColors.success
        : status === 'problem' || status === 'overdue'
          ? themeColors.error
          : status === 'on_the_way' || status === 'loaded' || status === 'partial'
            ? themeColors.warning
            : themeColors.info;
  const text =
    label ??
    orderStatusLabelsByLanguage[language][status as OrderStatus] ??
    deliveryStatusLabelsByLanguage[language][status as DeliveryStatus] ??
    paymentStatusLabelsByLanguage[language][status as PaymentStatus] ??
    String(status);

  return (
    <View style={[styles.badge, { backgroundColor: bgColor + '20', borderColor: bgColor }]}>
      <Text style={[styles.text, { color: bgColor }, language === 'ar' && styles.rtlText]}>{text}</Text>
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
  rtlText: {
    writingDirection: 'rtl',
  },
});
