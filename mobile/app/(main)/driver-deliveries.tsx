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
  const { currentUser, deliveries, updateDeliveryStopStatus, language, themeColors, t } = useApp();
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

        {todayDelivery.stops
          .sort((a, b) => a.stopNumber - b.stopNumber)
          .map((stop) => (
            <DeliveryCard
              key={stop.id}
              stop={stop}
              onStatusChange={(status) =>
                updateDeliveryStopStatus(todayDelivery.id, stop.id, status)
              }
              onPress={() =>
                router.push(`/(main)/driver-delivery/${stop.id}?deliveryId=${todayDelivery.id}`)
              }
            />
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  empty: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl },
});
