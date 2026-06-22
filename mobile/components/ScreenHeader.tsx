import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: { label: string; onPress: () => void };
}

export function ScreenHeader({ title, subtitle, showBack = true, rightAction }: ScreenHeaderProps) {
  const router = useRouter();
  const { language, t, themeColors } = useApp();
  const isArabic = language === 'ar';

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {showBack && router.canGoBack() ? (
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={[styles.backText, { color: themeColors.primary }, isArabic && styles.rtlText]}>{t('back')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
        {rightAction && (
          <TouchableOpacity onPress={rightAction.onPress}>
            <Text style={[styles.rightAction, { color: themeColors.primary }, isArabic && styles.rtlText]}>{rightAction.label}</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={[styles.title, { color: themeColors.text }, isArabic && styles.rtlText]}>{title}</Text>
      {subtitle && <Text style={[styles.subtitle, { color: themeColors.textSecondary }, isArabic && styles.rtlText]}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  backBtn: {
    minWidth: 60,
  },
  backText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  rightAction: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
