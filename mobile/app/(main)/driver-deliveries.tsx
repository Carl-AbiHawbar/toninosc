import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { ScreenHeader } from '@/components/ScreenHeader';
import { DeliveryCard } from '@/components/DeliveryCard';
import { AppButton } from '@/components/AppButton';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { getDateKey } from '@/utils/helpers';

export default function DriverDeliveriesScreen() {
  const router = useRouter();
  const { currentUser, deliveries, updateDeliveryStopStatus, moveDeliveryStop, language, themeColors, t } = useApp();
  const today = getDateKey();

  const todayDelivery = deliveries.find(
    (d) => d.driverId === currentUser?.id && d.routeDate === today
  );

  if (!todayDelivery) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
        <View style={styles.container}>
          <ScreenHeader title={t('todaysDeliveries')} />
          <Text style={[styles.empty, { color: themeColors.textSecondary }]}>
            {language === 'ar' ? 'لا توجد توصيلات مجدولة اليوم.' : 'No deliveries scheduled for today.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const completed = todayDelivery.stops.filter((s) => s.status === 'delivered').length;
  const orderedStops = [...todayDelivery.stops].sort((a, b) => a.stopNumber - b.stopNumber);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader
          title={t('todaysDeliveries')}
          subtitle={
            language === 'ar'
              ? `${completed} من ${todayDelivery.stops.length} محطات مكتملة`
              : `${completed} of ${todayDelivery.stops.length} stops done`
          }
        />

        <View style={styles.routeHeader}>
          <Text style={[styles.routeTitle, { color: themeColors.text }]}>
            {language === 'ar' ? 'ترتيب التوصيل' : 'Delivery order'}
          </Text>
        </View>

        {orderedStops.map((stop, index) => (
          <View key={stop.id} style={styles.stopBlock}>
            <View style={styles.reorderRow}>
              <AppButton
                title={language === 'ar' ? 'أعلى' : 'Up'}
                icon="↑"
                onPress={() => moveDeliveryStop(todayDelivery.id, stop.id, 'up')}
                disabled={index === 0}
                variant="outline"
                style={styles.reorderButton}
                textStyle={styles.reorderText}
              />
              <AppButton
                title={language === 'ar' ? 'أسفل' : 'Down'}
                icon="↓"
                onPress={() => moveDeliveryStop(todayDelivery.id, stop.id, 'down')}
                disabled={index === orderedStops.length - 1}
                variant="outline"
                style={styles.reorderButton}
                textStyle={styles.reorderText}
              />
            </View>
            <DeliveryCard
              stop={stop}
              onStatusChange={(status) =>
                updateDeliveryStopStatus(todayDelivery.id, stop.id, status)
              }
              onPress={() =>
                router.push(`/(main)/driver-delivery/${stop.id}?deliveryId=${todayDelivery.id}`)
              }
            />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  empty: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl },
  routeHeader: { marginBottom: spacing.sm },
  routeTitle: { fontSize: 16, fontWeight: '800' },
  stopBlock: { marginBottom: spacing.sm },
  reorderRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs },
  reorderButton: { flex: 1, minHeight: 38, paddingVertical: spacing.xs },
  reorderText: { fontSize: 13 },
});
