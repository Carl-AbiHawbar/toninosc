import { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { mockUsers, roleLabels, roleEmojis } from '@/data/mockUsers';
import { Role } from '@/types';
import { colors } from '@/theme/colors';
import { borderRadius, spacing } from '@/theme/spacing';

const roleOrder: Role[] = [
  'branch_manager',
  'admin',
  'warehouse',
  'driver',
  'finance',
  'supplier',
];

export default function LoginScreen() {
  const router = useRouter();
  const { currentUser, login } = useApp();

  useEffect(() => {
    if (currentUser) {
      router.replace('/(main)/home');
    }
  }, [currentUser, router]);

  const handleSelectUser = (userId: string) => {
    login(userId);
    router.replace('/(main)/home');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>🥞</Text>
          <Text style={styles.appName}>Tonino Supply</Text>
          <Text style={styles.tagline}>Internal supply & ordering portal</Text>
        </View>

        <Text style={styles.sectionTitle}>Choose your role to enter</Text>
        <Text style={styles.hint}>Demo mode — no password needed</Text>

        {roleOrder.map((role) => {
          const users = mockUsers.filter((u) => u.role === role);
          if (users.length === 0) return null;

          return (
            <View key={role} style={styles.roleSection}>
              <Text style={styles.roleLabel}>
                {roleEmojis[role]} {roleLabels[role]}
              </Text>
              {users.map((user) => (
                <TouchableOpacity
                  key={user.id}
                  style={styles.userCard}
                  onPress={() => handleSelectUser(user.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                  </View>
                  <Text style={styles.enterArrow}>Enter →</Text>
                </TouchableOpacity>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.lg,
  },
  logo: {
    fontSize: 64,
    marginBottom: spacing.sm,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
  },
  tagline: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  hint: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  roleSection: {
    marginBottom: spacing.lg,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  userEmail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  enterArrow: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
});
