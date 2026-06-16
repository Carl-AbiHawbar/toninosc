import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useApp } from '@/context/AppContext';
import { mockUsers, roleLabels } from '@/data/mockUsers';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AppCard } from '@/components/AppCard';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function SettingsScreen() {
  const { currentUser } = useApp();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader title="Settings & Users" subtitle="Placeholder — backend coming soon" />

        <AppCard style={styles.profileCard}>
          <Text style={styles.profileLabel}>Logged in as</Text>
          <Text style={styles.profileName}>{currentUser?.name}</Text>
          <Text style={styles.profileRole}>{currentUser ? roleLabels[currentUser.role] : ''}</Text>
          <Text style={styles.profileEmail}>{currentUser?.email}</Text>
        </AppCard>

        <Text style={styles.sectionTitle}>All Users (Mock)</Text>
        {mockUsers.map((user) => (
          <AppCard key={user.id} style={styles.userCard}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userRole}>{roleLabels[user.role]}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </AppCard>
        ))}

        <Text style={styles.comingSoon}>
          User management, permissions, and branch assignments will connect to the backend later.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  profileCard: { marginBottom: spacing.lg },
  profileLabel: { fontSize: 13, color: colors.textSecondary },
  profileName: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 4 },
  profileRole: { fontSize: 15, color: colors.primary, fontWeight: '600', marginTop: 2 },
  profileEmail: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  userCard: { marginBottom: spacing.sm },
  userName: { fontSize: 16, fontWeight: '700', color: colors.text },
  userRole: { fontSize: 14, color: colors.primary, marginTop: 2 },
  userEmail: { fontSize: 13, color: colors.textSecondary },
  comingSoon: { fontSize: 14, color: colors.textSecondary, fontStyle: 'italic', marginTop: spacing.lg, textAlign: 'center' },
});
