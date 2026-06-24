import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useApp } from '@/context/AppContext';
import { roleLabelsByLanguage } from '@/i18n/translations';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AppCard } from '@/components/AppCard';
import { AppButton } from '@/components/AppButton';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { formatDate } from '@/utils/helpers';

export default function SettingsScreen() {
  const { currentUser, users, auditEvents, language, toggleLanguage, themeMode, themeColors, toggleTheme, t } = useApp();
  const isArabic = language === 'ar';
  const canViewAllUsers = currentUser?.role === 'admin';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader title={t('settings')} subtitle={t('settingsSubtitle')} />

        <AppCard style={styles.profileCard}>
          <Text style={[styles.profileLabel, { color: themeColors.textSecondary }, isArabic && styles.rtlText]}>{t('language')}</Text>
          <AppButton
            title={isArabic ? t('switchToEnglish') : t('switchToArabic')}
            onPress={toggleLanguage}
            variant="outline"
            style={styles.languageButton}
            textStyle={styles.languageButtonText}
          />
          <Text style={[styles.profileLabel, { color: themeColors.textSecondary }, isArabic && styles.rtlText]}>{t('darkMode')}</Text>
          <AppButton
            title={themeMode === 'dark' ? t('lightMode') : t('darkMode')}
            onPress={toggleTheme}
            variant="outline"
            style={styles.languageButton}
            textStyle={styles.languageButtonText}
          />
        </AppCard>

        <AppCard style={styles.profileCard}>
          <Text style={[styles.profileLabel, { color: themeColors.textSecondary }, isArabic && styles.rtlText]}>{t('loggedInAs')}</Text>
          <Text style={[styles.profileName, { color: themeColors.text }, isArabic && styles.rtlText]}>{currentUser?.name}</Text>
          <Text style={[styles.profileRole, { color: themeColors.primary }, isArabic && styles.rtlText]}>
            {currentUser ? roleLabelsByLanguage[language][currentUser.role] : ''}
          </Text>
          <Text style={[styles.profileEmail, { color: themeColors.textSecondary }, isArabic && styles.rtlText]}>{currentUser?.email}</Text>
        </AppCard>

        {canViewAllUsers ? (
          <>
            <Text style={[styles.sectionTitle, { color: themeColors.text }, isArabic && styles.rtlText]}>{t('allUsers')}</Text>
            {users.map((user) => (
              <AppCard key={user.id} style={styles.userCard}>
                <Text style={[styles.userName, { color: themeColors.text }, isArabic && styles.rtlText]}>
                  {user.name} {user.active === false ? '(inactive)' : ''}
                </Text>
                <Text style={[styles.userRole, { color: themeColors.primary }, isArabic && styles.rtlText]}>
                  {roleLabelsByLanguage[language][user.role]}
                </Text>
                <Text style={[styles.userEmail, { color: themeColors.textSecondary }, isArabic && styles.rtlText]}>
                  {user.username ?? user.email} - {user.email}
                </Text>
              </AppCard>
            ))}
            <AppCard style={styles.userCard}>
              <Text style={[styles.userName, { color: themeColors.text }, isArabic && styles.rtlText]}>
                {isArabic ? 'User security controls' : 'User security controls'}
              </Text>
              <Text style={[styles.userEmail, { color: themeColors.textSecondary }, isArabic && styles.rtlText]}>
                {isArabic
                  ? 'Changing passwords, creating login users, and deleting auth users must run through a backend or setup script with the Supabase service role key. The mobile app must not store that key.'
                  : 'Changing passwords, creating login users, and deleting auth users must run through a backend or setup script with the Supabase service role key. The mobile app must not store that key.'}
              </Text>
            </AppCard>
            <Text style={[styles.sectionTitle, { color: themeColors.text }, isArabic && styles.rtlText]}>
              {isArabic ? 'سجل التدقيق' : 'Audit Log'}
            </Text>
            {auditEvents.slice(0, 8).map((event) => {
              const actor = users.find((user) => user.id === event.actorUserId);
              return (
                <AppCard key={event.id} style={styles.userCard}>
                  <Text style={[styles.userName, { color: themeColors.text }, isArabic && styles.rtlText]}>{event.action}</Text>
                  <Text style={[styles.userEmail, { color: themeColors.textSecondary }, isArabic && styles.rtlText]}>
                    {formatDate(event.createdAt)} · {actor?.name ?? 'System'}
                  </Text>
                  {event.note && (
                    <Text style={[styles.userEmail, { color: themeColors.textSecondary }, isArabic && styles.rtlText]}>{event.note}</Text>
                  )}
                </AppCard>
              );
            })}
          </>
        ) : (
          <AppCard>
            <Text style={[styles.comingSoon, { color: themeColors.textSecondary }, isArabic && styles.rtlText]}>
              {isArabic ? 'إدارة المستخدمين متاحة للمدير فقط.' : 'User management is available to admins only.'}
            </Text>
          </AppCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  profileCard: { marginBottom: spacing.lg },
  profileLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.sm },
  profileName: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 4 },
  profileRole: { fontSize: 15, color: colors.primary, fontWeight: '600', marginTop: 2 },
  profileEmail: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  userCard: { marginBottom: spacing.sm },
  userName: { fontSize: 16, fontWeight: '700', color: colors.text },
  userRole: { fontSize: 14, color: colors.primary, marginTop: 2 },
  userEmail: { fontSize: 13, color: colors.textSecondary },
  comingSoon: { fontSize: 14, color: colors.textSecondary, fontStyle: 'italic', marginTop: spacing.lg, textAlign: 'center' },
  languageButton: { minHeight: 44 },
  languageButtonText: { fontSize: 15 },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
