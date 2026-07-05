import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppButton } from '@/components/AppButton';
import { useApp } from '@/context/AppContext';
import { colors } from '@/theme/colors';
import { borderRadius, spacing } from '@/theme/spacing';

export default function LoginScreen() {
  const router = useRouter();
  const { currentUser, login, language, toggleLanguage, themeMode, themeColors, toggleTheme, t, isLoading, dataError } = useApp();
  const isArabic = language === 'ar';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser) {
      router.replace('/(main)/home');
    }
  }, [currentUser, router]);

  const handleLogin = async () => {
    setSubmitting(true);
    const result = await login(username, password);
    setSubmitting(false);

    if (result.ok) {
      router.replace('/(main)/home');
      return;
    }

    Alert.alert(
      isArabic ? 'تعذر تسجيل الدخول' : 'Login failed',
      result.error ?? dataError ?? (isArabic ? 'تأكد من اسم المستخدم وكلمة المرور.' : 'Check the username and password.')
    );
  };

  if (isLoading && !currentUser) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={themeColors.primary} />
          <Text style={[styles.loadingText, { color: themeColors.textSecondary }, isArabic && styles.rtlText]}>
            {isArabic ? 'Checking saved login...' : 'Checking saved login...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
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

        <View style={[styles.header, { borderColor: themeColors.border }]}>
          <Text style={[styles.appName, { color: themeColors.primary }]}>{t('appName')}</Text>
          <Text style={[styles.tagline, { color: themeColors.textSecondary }, isArabic && styles.rtlText]}>{t('tagline')}</Text>
        </View>

        <View style={[styles.loginCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }, isArabic && styles.rtlText]}>
            {isArabic ? 'تسجيل الدخول' : 'Sign in'}
          </Text>

          <Text style={[styles.label, { color: themeColors.textSecondary }, isArabic && styles.rtlText]}>
            {isArabic ? 'اسم المستخدم' : 'Username'}
          </Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            value={username}
            onChangeText={setUsername}
            placeholder={isArabic ? 'Username' : 'Username'}
            placeholderTextColor={themeColors.textSecondary}
            style={[
              styles.input,
              {
                backgroundColor: themeColors.background,
                borderColor: themeColors.border,
                color: themeColors.text,
                textAlign: isArabic ? 'right' : 'left',
              },
            ]}
          />

          <Text style={[styles.label, { color: themeColors.textSecondary }, isArabic && styles.rtlText]}>
            {isArabic ? 'كلمة المرور' : 'Password'}
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Password"
            placeholderTextColor={themeColors.textSecondary}
            style={[
              styles.input,
              {
                backgroundColor: themeColors.background,
                borderColor: themeColors.border,
                color: themeColors.text,
                textAlign: isArabic ? 'right' : 'left',
              },
            ]}
          />

          <AppButton
            title={submitting || isLoading ? (isArabic ? 'جار الدخول...' : 'Signing in...') : isArabic ? 'دخول' : 'Sign in'}
            onPress={handleLogin}
            disabled={submitting || isLoading}
            style={styles.loginButton}
          />

          {(submitting || isLoading) && <ActivityIndicator color={themeColors.primary} style={styles.spinner} />}

          {dataError ? (
            <Text style={[styles.errorText, { color: themeColors.error }, isArabic && styles.rtlText]}>{dataError}</Text>
          ) : null}

        </View>
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
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  languageButton: {
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  languageText: {
    fontSize: 14,
    fontWeight: '700',
  },
  header: {
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    marginTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  appName: {
    fontSize: 30,
    fontWeight: '800',
  },
  tagline: {
    fontSize: 16,
    marginTop: spacing.xs,
  },
  loginCard: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    minHeight: 46,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    marginBottom: spacing.md,
  },
  loginButton: {
    minHeight: 46,
    marginTop: spacing.xs,
  },
  spinner: {
    marginTop: spacing.md,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: spacing.md,
    textAlign: 'center',
  },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
