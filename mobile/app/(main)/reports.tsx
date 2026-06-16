import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { mockBranches } from '@/data/mockBranches';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AppCard } from '@/components/AppCard';
import { DashboardCard } from '@/components/DashboardCard';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

const topItems = [
  { name: 'Nutella Bucket', qty: 48, emoji: '🍫' },
  { name: 'Crepe Dough Mix', qty: 36, emoji: '🥞' },
  { name: 'Lotus Spread', qty: 32, emoji: '🍪' },
  { name: 'Crepe Boxes', qty: 28, emoji: '📦' },
  { name: 'Banana', qty: 25, emoji: '🍌' },
];

const branchConsumption = [
  { branch: 'Tonino Verdun', amount: 2450 },
  { branch: 'Tonino ABC Ashrafieh', amount: 1890 },
  { branch: 'Tonino Hamra', amount: 1620 },
  { branch: 'Tonino Dubai Mall', amount: 3100 },
];

const forecasts = [
  'Based on last 4 weeks and last summer demand, order 15 Nutella buckets before Friday.',
  'Strawberry demand rising — suggest 20 kg for all Beirut branches next week.',
  'Crepe box usage up 12% vs last month — reorder 50 packs.',
  'Pistachio cream trending — Dubai branch may need 8 extra jars.',
  'Waffle mix stock sufficient for 2 weeks at current consumption.',
];

export default function ReportsScreen() {
  const router = useRouter();
  const { alerts } = useApp();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader title="Reports" subtitle="Mock analytics preview" />

        <Text style={styles.sectionTitle}>Top Ordered Items</Text>
        <View style={styles.dashboardGrid}>
          {topItems.map((item, idx) => (
            <DashboardCard
              key={item.name}
              title={item.name}
              value={item.qty}
              emoji={item.emoji}
              subtitle="units this month"
              accentColor={idx === 0 ? colors.primary : colors.textSecondary}
            />
          ))}
        </View>

        <Text style={styles.sectionTitle}>Branch Consumption This Month</Text>
        {branchConsumption.map((b) => (
          <AppCard key={b.branch} style={styles.barCard}>
            <View style={styles.barRow}>
              <Text style={styles.barLabel}>{b.branch}</Text>
              <Text style={styles.barValue}>${b.amount}</Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[styles.barFill, { width: `${(b.amount / 3100) * 100}%` }]}
              />
            </View>
          </AppCard>
        ))}

        <Text style={styles.sectionTitle}>Branch Comparison</Text>
        <AppCard style={styles.compareCard}>
          <Text style={styles.compareText}>
            📈 Dubai Mall orders 27% more than average branch
          </Text>
          <Text style={styles.compareText}>
            📉 Hamra orders 15% less packaging — check portion sizes
          </Text>
          <Text style={styles.compareText}>
            ⬆️ Verdun Nutella usage up 8% vs last month
          </Text>
        </AppCard>

        <Text style={styles.sectionTitle}>Demand Forecast</Text>
        {forecasts.map((f, idx) => (
          <AppCard key={idx} style={styles.forecastCard}>
            <Text style={styles.forecastIcon}>💡</Text>
            <Text style={styles.forecastText}>{f}</Text>
          </AppCard>
        ))}

        <Text style={styles.sectionTitle}>Suggested Purchase Quantities</Text>
        <AppCard style={styles.suggestCard}>
          <Text style={styles.suggestRow}>Nutella Bucket → 15 units</Text>
          <Text style={styles.suggestRow}>Pistachio Cream → 10 jars</Text>
          <Text style={styles.suggestRow}>Strawberry → 20 kg</Text>
          <Text style={styles.suggestRow}>Crepe Boxes → 50 packs</Text>
        </AppCard>

        <Text style={styles.sectionTitle}>Previous Year Comparison</Text>
        <View style={styles.dashboardGrid}>
          <DashboardCard title="June 2025 Total" value="$18,400" emoji="📅" />
          <DashboardCard title="June 2026 Total" value="$21,200" emoji="📅" accentColor={colors.success} subtitle="+15% vs last year" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.sm, marginTop: spacing.md },
  dashboardGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  barCard: { marginBottom: spacing.sm },
  barRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  barLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  barValue: { fontSize: 15, fontWeight: '700', color: colors.primary },
  barTrack: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  compareCard: { marginBottom: spacing.sm },
  compareText: { fontSize: 14, color: colors.text, marginBottom: spacing.xs, lineHeight: 20 },
  forecastCard: { flexDirection: 'row', marginBottom: spacing.sm, alignItems: 'flex-start' },
  forecastIcon: { fontSize: 20, marginRight: spacing.sm },
  forecastText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
  suggestCard: { marginBottom: spacing.sm },
  suggestRow: { fontSize: 15, color: colors.text, marginBottom: spacing.xs, fontWeight: '600' },
});
