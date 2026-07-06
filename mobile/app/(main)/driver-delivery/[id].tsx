import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AppCard } from '@/components/AppCard';
import { AppButton } from '@/components/AppButton';
import { StatusBadge } from '@/components/StatusBadge';
import { spacing } from '@/theme/spacing';
import { formatCurrency } from '@/utils/helpers';
import { getStockItemName, getStockItemUnit } from '@/utils/stockLocalization';

export default function DriverDeliveryDetailScreen() {
  const { id, deliveryId } = useLocalSearchParams<{ id: string; deliveryId: string }>();
  const router = useRouter();
  const { branches, deliveries, updateDeliveryStopStatus, language, themeColors } = useApp();
  const isArabic = language === 'ar';

  const delivery = deliveries.find((d) => d.id === deliveryId);
  const stop = delivery?.stops.find((s) => s.id === id);
  const branch = branches.find((b) => b.id === stop?.branchId);

  if (!stop || !delivery) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
        <View style={styles.container}>
          <ScreenHeader title={isArabic ? 'المحطة غير موجودة' : 'Stop Not Found'} />
        </View>
      </SafeAreaView>
    );
  }

  const handleConfirm = () => {
    updateDeliveryStopStatus(delivery.id, stop.id, 'delivered');
    router.back();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader title={isArabic ? `محطة ${stop.stopNumber}` : `Stop ${stop.stopNumber}`} subtitle={branch?.name} />

        <View style={styles.statusRow}>
          <StatusBadge status={stop.status} />
          <Text style={[styles.total, { color: themeColors.primary }]}>
            {formatCurrency(stop.invoiceTotal)}
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{isArabic ? 'قائمة التوصيل' : 'Delivery Checklist'}</Text>
        {stop.items.map((item, idx) => (
          <AppCard key={idx} style={styles.checkItem}>
            <Text style={[styles.checkText, { color: themeColors.text }, isArabic && styles.rtlText]}>
              {item.quantity} {getStockItemUnit(item, language)} - {getStockItemName(item, language)}
            </Text>
          </AppCard>
        ))}

        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{isArabic ? 'تأكيد الفرع' : 'Branch Confirmation'}</Text>
        <View style={styles.confirmRow}>
          <AppCard style={styles.confirmBox}>
            <Text style={[styles.confirmLabel, { color: themeColors.text }]}>{isArabic ? 'التوقيع' : 'Signature'}</Text>
            <Text style={[styles.confirmHint, { color: themeColors.textSecondary }]}>{isArabic ? 'اضغط للتوقيع' : 'Tap to sign'}</Text>
          </AppCard>
          <AppCard style={styles.confirmBox}>
            <Text style={[styles.confirmLabel, { color: themeColors.text }]}>{isArabic ? 'رمز PIN' : 'PIN Code'}</Text>
            <Text style={[styles.confirmHint, { color: themeColors.textSecondary }]}>{isArabic ? 'أدخل الرمز' : 'Enter code'}</Text>
          </AppCard>
          <AppCard style={styles.confirmBox}>
            <Text style={[styles.confirmLabel, { color: themeColors.text }]}>{isArabic ? 'صورة إثبات' : 'Photo Proof'}</Text>
            <Text style={[styles.confirmHint, { color: themeColors.textSecondary }]}>{isArabic ? 'التقط صورة' : 'Take photo'}</Text>
          </AppCard>
        </View>

        <View style={styles.buttons}>
          <AppButton title={isArabic ? 'تأكيد التسليم' : 'Confirm Delivered'} onPress={handleConfirm} variant="success" />
          <AppButton
            title={isArabic ? 'الإبلاغ عن مشكلة' : 'Report Problem'}
            onPress={() => {
              updateDeliveryStopStatus(delivery.id, stop.id, 'problem');
              router.back();
            }}
            variant="danger"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  total: { fontSize: 20, fontWeight: '800' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: spacing.sm, marginTop: spacing.sm },
  checkItem: { marginBottom: spacing.xs },
  checkText: { fontSize: 15 },
  confirmRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  confirmBox: { flex: 1, alignItems: 'center', padding: spacing.sm, minHeight: 84, justifyContent: 'center' },
  confirmLabel: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  confirmHint: { fontSize: 11, textAlign: 'center', marginTop: 2 },
  buttons: { gap: spacing.md },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
