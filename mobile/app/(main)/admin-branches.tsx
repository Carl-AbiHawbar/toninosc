import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { mockBranches } from '@/data/mockBranches';
import { mockUsers } from '@/data/mockUsers';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AppCard } from '@/components/AppCard';
import { useApp } from '@/context/AppContext';
import { spacing } from '@/theme/spacing';

export default function AdminBranchesScreen() {
  const { language, themeColors, t } = useApp();
  const isArabic = language === 'ar';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader
          title={t('allBranches')}
          subtitle={isArabic ? `${mockBranches.length} فروع` : `${mockBranches.length} branches`}
        />

        {mockBranches.map((branch) => {
          const manager = mockUsers.find((u) => u.id === branch.managerId);
          return (
            <AppCard key={branch.id} style={styles.card}>
              <View style={styles.header}>
                <Text style={[styles.name, { color: themeColors.text }]}>{branch.name}</Text>
                <View
                  style={[
                    styles.franchiseBadge,
                    { backgroundColor: `${branch.suppliesFree ? themeColors.success : themeColors.warning}20` },
                  ]}
                >
                  <Text
                    style={[
                      styles.franchiseText,
                      { color: branch.suppliesFree ? themeColors.success : themeColors.warning },
                    ]}
                  >
                    {branch.suppliesFree
                      ? isArabic
                        ? 'توريد مجاني'
                        : 'Free supply'
                      : isArabic
                        ? 'فرنشايز'
                        : 'Franchise'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.metaText, { color: themeColors.textSecondary }]}>{isArabic ? 'الموقع' : 'Location'}: {branch.address}</Text>
              <Text style={[styles.metaText, { color: themeColors.textSecondary }]}>{branch.city}</Text>
              <Text style={[styles.metaText, { color: themeColors.textSecondary }]}>{isArabic ? 'الهاتف' : 'Phone'}: {branch.phone}</Text>
              {branch.suppliesFree && (
                <Text style={[styles.metaText, { color: themeColors.success }]}>
                  {isArabic ? 'يتم تتبع الطلبات بدون تحصيل.' : 'Orders are tracked without payment collection.'}
                </Text>
              )}
              {manager && (
                <Text style={[styles.manager, { color: themeColors.text }]}>{isArabic ? 'المدير' : 'Manager'}: {manager.name}</Text>
              )}
            </AppCard>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: { marginBottom: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  name: { fontSize: 20, fontWeight: '800', flex: 1 },
  franchiseBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 8 },
  franchiseText: { fontSize: 12, fontWeight: '700' },
  metaText: { fontSize: 14, marginBottom: 2 },
  manager: { fontSize: 14, marginTop: spacing.sm, fontWeight: '600' },
});
