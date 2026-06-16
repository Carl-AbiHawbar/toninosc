import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AlertCard } from '@/components/AlertCard';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function AlertsScreen() {
  const router = useRouter();
  const { alerts } = useApp();

  const handleAlertAction = (alert: typeof alerts[0]) => {
    if (alert.type === 'low_stock' || alert.type === 'critical_stock' || alert.type === 'expiring_soon') {
      router.push('/(main)/inventory');
    } else if (alert.type === 'overdue_invoice' && alert.invoiceId) {
      router.push(`/(main)/invoice/${alert.invoiceId}`);
    } else if (alert.type === 'unusual_order' || alert.type === 'delivery_problem') {
      router.push('/(main)/warehouse-orders');
    } else {
      router.push('/(main)/reports');
    }
  };

  const sorted = [...alerts].sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader title="Alerts" subtitle={`${alerts.length} active alerts`} />

        {sorted.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onAction={() => handleAlertAction(alert)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
});
