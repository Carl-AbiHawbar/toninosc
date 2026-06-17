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
import { mockUsers, roleEmojis } from '@/data/mockUsers';
import { roleLabelsByLanguage } from '@/i18n/translations';
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
  const { currentUser, login, language, toggleLanguage, themeMode, themeColors, toggleTheme, t } = useApp();
  const isArabic = language === 'ar';

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
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.languageButton, { backgroundColor: themeColors.card, borderColor: themeColors.border }]} onPress={toggleLanguage}>
            <Text style={[styles.languageText, { color: themeColors.primary }]}>
              {isArabic ? t('switchToEnglish') : t('switchToArabic')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.languageButton, { backgroundColor: themeColors.card, borderColor: themeColors.border }]} onPress={toggleTheme}>
            <Text style={[styles.languageText, { color: themeColors.primary }]}>
              {themeMode === 'dark' ? t('lightMode') : t('darkMode')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <Text style={styles.logo}>🥞</Text>
          <Text style={[styles.appName, { color: themeColors.primary }]}>{t('appName')}</Text>
          <Text style={[styles.tagline, { color: themeColors.textSecondary }, isArabic && styles.rtlText]}>{t('tagline')}</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: themeColors.text }, isArabic && styles.rtlText]}>{t('chooseRole')}</Text>
        <Text style={[styles.hint, { color: themeColors.textSecondary }, isArabic && styles.rtlText]}>{t('demoMode')}</Text>

        {roleOrder.map((role) => {
          const users = mockUsers.filter((u) => u.role === role);
          if (users.length === 0) return null;

          return (
            <View key={role} style={styles.roleSection}>
              <Text style={[styles.roleLabel, { color: themeColors.text }, isArabic && styles.rtlText]}>
                {roleEmojis[role]} {roleLabelsByLanguage[language][role]}
              </Text>
              {users.map((user) => (
                <TouchableOpacity
                  key={user.id}
                  style={[
                    styles.userCard,
                    { backgroundColor: themeColors.card, borderColor: themeColors.border },
                    isArabic && styles.userCardRtl,
                  ]}
                  onPress={() => handleSelectUser(user.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: themeColors.text }, isArabic && styles.rtlText]}>{user.name}</Text>
                    <Text style={[styles.userEmail, { color: themeColors.textSecondary }, isArabic && styles.rtlText]}>{user.email}</Text>
                  </View>
                  <Text style={[styles.enterArrow, { color: themeColors.primary }]}>{t('enter')}</Text>
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
  languageButton: {
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  languageText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
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
  userCardRtl: {
    flexDirection: 'row-reverse',
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
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
