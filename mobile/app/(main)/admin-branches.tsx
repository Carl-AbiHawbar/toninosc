import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppCard } from '@/components/AppCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useApp } from '@/context/AppContext';
import { spacing } from '@/theme/spacing';

export default function AdminBranchesScreen() {
  const { branches, language, themeColors, t } = useApp();
  const isArabic = language === 'ar';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader
          title={t('allBranches')}
          subtitle={isArabic ? `${branches.length} branches` : `${branches.length} branches`}
        />

        {branches.map((branch) => (
          <AppCard key={branch.id} style={styles.card}>
            <View style={styles.header}>
              <Text style={[styles.name, { color: themeColors.text }, isArabic && styles.rtlText]}>{branch.name}</Text>
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
                  {branch.suppliesFree ? (isArabic ? 'Free supply' : 'Free supply') : isArabic ? 'Franchise' : 'Franchise'}
                </Text>
              </View>
            </View>
            <Text style={[styles.metaText, { color: themeColors.textSecondary }, isArabic && styles.rtlText]}>
              {isArabic ? 'Location' : 'Location'}: {branch.address}
            </Text>
            <Text style={[styles.metaText, { color: themeColors.textSecondary }, isArabic && styles.rtlText]}>{branch.city}</Text>
            <Text style={[styles.metaText, { color: themeColors.textSecondary }, isArabic && styles.rtlText]}>
              {isArabic ? 'Phone' : 'Phone'}: {branch.phone}
            </Text>
            {branch.suppliesFree && (
              <Text style={[styles.metaText, { color: themeColors.success }, isArabic && styles.rtlText]}>
                {isArabic ? 'Orders are tracked without payment collection.' : 'Orders are tracked without payment collection.'}
              </Text>
            )}
          </AppCard>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: { marginBottom: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm },
  name: { fontSize: 20, fontWeight: '800', flex: 1 },
  franchiseBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 8 },
  franchiseText: { fontSize: 12, fontWeight: '700' },
  metaText: { fontSize: 14, marginBottom: 2 },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
