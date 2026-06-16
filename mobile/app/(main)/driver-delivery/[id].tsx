import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { mockBranches } from '@/data/mockBranches';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AppCard } from '@/components/AppCard';
import { AppButton } from '@/components/AppButton';
import { StatusBadge } from '@/components/StatusBadge';
import { colors } from '@/theme/colors';
import { borderRadius, spacing } from '@/theme/spacing';
import { formatCurrency } from '@/utils/helpers';

export default function DriverDeliveryDetailScreen() {
  const { id, deliveryId } = useLocalSearchParams<{ id: string; deliveryId: string }>();
  const router = useRouter();
  const { deliveries, updateDeliveryStopStatus } = useApp();

  const delivery = deliveries.find((d) => d.id === deliveryId);
  const stop = delivery?.stops.find((s) => s.id === id);
  const branch = mockBranches.find((b) => b.id === stop?.branchId);

  if (!stop || !delivery) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <ScreenHeader title="Stop Not Found" />
        </View>
      </SafeAreaView>
    );
  }

  const handleConfirm = () => {
    updateDeliveryStopStatus(delivery.id, stop.id, 'delivered');
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader title={`Stop ${stop.stopNumber}`} subtitle={branch?.name} />

        <View style={styles.statusRow}>
          <StatusBadge status={stop.status} />
          <Text style={styles.total}>{formatCurrency(stop.invoiceTotal)}</Text>
        </View>

        <Text style={styles.sectionTitle}>Delivery Checklist</Text>
        {stop.items.map((item, idx) => (
          <AppCard key={idx} style={styles.checkItem}>
            <Text style={styles.checkText}>
              ☑️ {item.quantity} {item.unit} — {item.name}
            </Text>
          </AppCard>
        ))}

        <Text style={styles.sectionTitle}>Branch Confirmation</Text>
        <View style={styles.confirmRow}>
          <AppCard style={styles.confirmBox}>
            <Text style={styles.confirmEmoji}>✍️</Text>
            <Text style={styles.confirmLabel}>Signature</Text>
            <Text style={styles.confirmHint}>Tap to sign</Text>
          </AppCard>
          <AppCard style={styles.confirmBox}>
            <Text style={styles.confirmEmoji}>🔢</Text>
            <Text style={styles.confirmLabel}>PIN Code</Text>
            <Text style={styles.confirmHint}>Enter code</Text>
          </AppCard>
          <AppCard style={styles.confirmBox}>
            <Text style={styles.confirmEmoji}>📷</Text>
            <Text style={styles.confirmLabel}>Photo Proof</Text>
            <Text style={styles.confirmHint}>Take photo</Text>
          </AppCard>
        </View>

        <View style={styles.buttons}>
          <AppButton title="Confirm Delivered" icon="✅" onPress={handleConfirm} variant="success" />
          <AppButton
            title="Report Problem"
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
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  total: { fontSize: 20, fontWeight: '800', color: colors.primary },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.sm, marginTop: spacing.sm },
  checkItem: { marginBottom: spacing.xs },
  checkText: { fontSize: 15, color: colors.text },
  confirmRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  confirmBox: { flex: 1, alignItems: 'center', padding: spacing.sm },
  confirmEmoji: { fontSize: 28, marginBottom: 4 },
  confirmLabel: { fontSize: 13, fontWeight: '700', color: colors.text },
  confirmHint: { fontSize: 11, color: colors.textSecondary },
  buttons: { gap: spacing.md },
});
