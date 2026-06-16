import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AppCard } from './AppCard';
import { colors } from '@/theme/colors';
import { borderRadius, spacing } from '@/theme/spacing';

interface DashboardCardProps {
  title: string;
  value: string | number;
  emoji?: string;
  subtitle?: string;
  onPress?: () => void;
  accentColor?: string;
}

export function DashboardCard({
  title,
  value,
  emoji,
  subtitle,
  onPress,
  accentColor = colors.primary,
}: DashboardCardProps) {
  const content = (
    <AppCard style={styles.card}>
      <View style={[styles.accent, { backgroundColor: accentColor }]} />
      {emoji && <Text style={styles.emoji}>{emoji}</Text>}
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </AppCard>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.wrapper}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.wrapper}>{content}</View>;
}

const styles = StyleSheet.create({
  wrapper: {
    width: '48%',
    marginBottom: spacing.md,
  },
  card: {
    overflow: 'hidden',
    minHeight: 120,
  },
  accent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  emoji: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
