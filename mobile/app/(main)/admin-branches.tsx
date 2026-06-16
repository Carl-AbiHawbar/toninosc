import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { mockBranches } from '@/data/mockBranches';
import { mockUsers } from '@/data/mockUsers';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AppCard } from '@/components/AppCard';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function AdminBranchesScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader title="All Branches" subtitle={`${mockBranches.length} locations`} />

        {mockBranches.map((branch) => {
          const manager = mockUsers.find((u) => u.id === branch.managerId);
          return (
            <AppCard key={branch.id} style={styles.card}>
              <View style={styles.header}>
                <Text style={styles.name}>{branch.name}</Text>
                {branch.isFranchise && (
                  <View style={styles.franchiseBadge}>
                    <Text style={styles.franchiseText}>Franchise</Text>
                  </View>
                )}
              </View>
              <Text style={styles.address}>📍 {branch.address}</Text>
              <Text style={styles.city}>{branch.city}</Text>
              <Text style={styles.phone}>📞 {branch.phone}</Text>
              {manager && (
                <Text style={styles.manager}>👤 Manager: {manager.name}</Text>
              )}
            </AppCard>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: { marginBottom: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  name: { fontSize: 20, fontWeight: '800', color: colors.text, flex: 1 },
  franchiseBadge: { backgroundColor: colors.warning + '20', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 8 },
  franchiseText: { fontSize: 12, fontWeight: '700', color: colors.warning },
  address: { fontSize: 14, color: colors.textSecondary, marginBottom: 2 },
  city: { fontSize: 14, color: colors.textSecondary, marginBottom: 2 },
  phone: { fontSize: 14, color: colors.textSecondary, marginBottom: 2 },
  manager: { fontSize: 14, color: colors.text, marginTop: spacing.sm, fontWeight: '600' },
});
