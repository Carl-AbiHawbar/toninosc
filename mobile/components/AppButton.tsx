import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors } from '@/theme/colors';
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

const variantStyles: Record<Variant, { bg: string; text: string; border?: string }> = {
  primary: { bg: colors.primary, text: colors.white },
  secondary: { bg: colors.text, text: colors.white },
  outline: { bg: colors.card, text: colors.primary, border: colors.primary },
  success: { bg: colors.success, text: colors.white },
  warning: { bg: colors.warning, text: colors.white },
  danger: { bg: colors.error, text: colors.white },
};

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
  const v = variantStyles[variant];

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: v.bg, borderColor: v.border ?? v.bg },
        variant === 'outline' && styles.outline,
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
  outline: {
    borderWidth: 2,
    backgroundColor: colors.card,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 18,
    fontWeight: '700',
  },
});
