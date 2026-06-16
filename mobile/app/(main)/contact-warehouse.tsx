import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AppCard } from '@/components/AppCard';
import { AppButton } from '@/components/AppButton';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function ContactWarehouseScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader title="Contact Warehouse" subtitle="Need help with your order?" />

        <AppCard style={styles.card}>
          <Text style={styles.emoji}>📦</Text>
          <Text style={styles.title}>Tonino Central Warehouse</Text>
          <Text style={styles.detail}>Industrial Zone, Beirut</Text>
          <Text style={styles.detail}>Open: Mon–Sat 8am–6pm</Text>
        </AppCard>

        <View style={styles.buttons}>
          <AppButton title="Call Warehouse" icon="📞" onPress={() => {}} />
          <AppButton title="WhatsApp" icon="💬" onPress={() => {}} variant="success" />
          <AppButton title="Send Email" icon="✉️" onPress={() => {}} variant="outline" />
        </View>

        <AppCard style={styles.hoursCard}>
          <Text style={styles.hoursTitle}>Order Cut-off Times</Text>
          <Text style={styles.hoursRow}>Beirut branches: Order by 4pm for next-day delivery</Text>
          <Text style={styles.hoursRow}>Dubai: Order by 2pm for next-day delivery</Text>
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: { alignItems: 'center', marginBottom: spacing.lg, padding: spacing.xl },
  emoji: { fontSize: 48, marginBottom: spacing.sm },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  detail: { fontSize: 15, color: colors.textSecondary, marginBottom: 4 },
  buttons: { gap: spacing.md, marginBottom: spacing.lg },
  hoursCard: { marginTop: spacing.sm },
  hoursTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  hoursRow: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.xs, lineHeight: 20 },
});
