import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors } from '@/theme/colors';
import { useApp } from '@/context/AppContext';
import { borderRadius, spacing, touchTarget } from '@/theme/spacing';

type Variant = 'primary' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: string;
}

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}: AppButtonProps) {
  const { themeColors } = useApp();
  const variantStyles: Record<Variant, { bg: string; text: string; border?: string }> = {
    primary: { bg: themeColors.primary, text: themeColors.white },
    secondary: { bg: themeColors.text, text: themeColors.background },
    outline: { bg: themeColors.card, text: themeColors.primary, border: themeColors.primary },
    success: { bg: themeColors.success, text: themeColors.white },
    warning: { bg: themeColors.warning, text: themeColors.white },
    danger: { bg: themeColors.error, text: themeColors.white },
  };
  const v = variantStyles[variant];

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: v.bg, borderColor: v.border ?? v.bg },
        variant === 'outline' && { borderWidth: 2, backgroundColor: themeColors.card },
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={v.text} />
      ) : (
        <Text style={[styles.text, { color: v.text }, textStyle]}>
          {icon ? `${icon} ` : ''}{title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: touchTarget.minHeight + 4,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 18,
    fontWeight: '700',
  },
});
