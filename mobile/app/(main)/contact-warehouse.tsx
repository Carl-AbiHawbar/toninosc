import { Alert, View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AppCard } from '@/components/AppCard';
import { AppButton } from '@/components/AppButton';
import { useApp } from '@/context/AppContext';
import { spacing } from '@/theme/spacing';

export default function ContactWarehouseScreen() {
  const { t, language, themeColors } = useApp();
  const isArabic = language === 'ar';
  const showDemoMessage = () => {
    Alert.alert(t('demoAction'), t('demoContact'));
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader
          title={t('contactWarehouse')}
          subtitle={isArabic ? 'هل تحتاج مساعدة في طلبك؟' : 'Need help with your order?'}
        />

        <AppCard style={styles.card}>
          <Text style={styles.emoji}>📦</Text>
          <Text style={[styles.title, { color: themeColors.text }, isArabic && styles.rtlText]}>
            Tonino Central Warehouse
          </Text>
          <Text style={[styles.detail, { color: themeColors.textSecondary }, isArabic && styles.rtlText]}>
            Industrial Zone, Beirut
          </Text>
          <Text style={[styles.detail, { color: themeColors.textSecondary }, isArabic && styles.rtlText]}>
            {isArabic ? 'مفتوح: الاثنين-السبت 8 صباحا-6 مساء' : 'Open: Mon-Sat 8am-6pm'}
          </Text>
        </AppCard>

        <View style={styles.buttons}>
          <AppButton title={isArabic ? 'اتصال بالمستودع' : 'Call Warehouse'} icon="📞" onPress={showDemoMessage} />
          <AppButton title={t('whatsApp')} icon="💬" onPress={showDemoMessage} variant="success" />
          <AppButton title={isArabic ? 'إرسال بريد' : 'Send Email'} icon="✉️" onPress={showDemoMessage} variant="outline" />
        </View>

        <AppCard style={styles.hoursCard}>
          <Text style={[styles.hoursTitle, { color: themeColors.text }, isArabic && styles.rtlText]}>
            {isArabic ? 'أوقات آخر طلب' : 'Order Cut-off Times'}
          </Text>
          <Text style={[styles.hoursRow, { color: themeColors.textSecondary }, isArabic && styles.rtlText]}>
            {isArabic ? 'فروع بيروت: اطلب قبل 4 مساء للتوصيل في اليوم التالي' : 'Beirut branches: Order by 4pm for next-day delivery'}
          </Text>
          <Text style={[styles.hoursRow, { color: themeColors.textSecondary }, isArabic && styles.rtlText]}>
            {isArabic ? 'دبي: اطلب قبل 2 مساء للتوصيل في اليوم التالي' : 'Dubai: Order by 2pm for next-day delivery'}
          </Text>
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: { alignItems: 'center', marginBottom: spacing.lg, padding: spacing.xl },
  emoji: { fontSize: 48, marginBottom: spacing.sm },
  title: { fontSize: 22, fontWeight: '800', marginBottom: spacing.sm },
  detail: { fontSize: 15, marginBottom: 4 },
  buttons: { gap: spacing.md, marginBottom: spacing.lg },
  hoursCard: { marginTop: spacing.sm },
  hoursTitle: { fontSize: 16, fontWeight: '700', marginBottom: spacing.sm },
  hoursRow: { fontSize: 14, marginBottom: spacing.xs, lineHeight: 20 },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
