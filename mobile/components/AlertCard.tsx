import { View, Text, StyleSheet } from 'react-native';
import { Alert } from '@/types';
import { AppCard } from './AppCard';
import { AppButton } from './AppButton';
import { useApp } from '@/context/AppContext';
import { spacing } from '@/theme/spacing';

interface AlertCardProps {
  alert: Alert;
  onAction?: () => void;
}

export function AlertCard({ alert, onAction }: AlertCardProps) {
  const { themeColors } = useApp();
  const color =
    alert.severity === 'critical'
      ? themeColors.error
      : alert.severity === 'warning'
        ? themeColors.warning
        : themeColors.info;

  return (
    <AppCard style={[styles.card, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <View style={styles.header}>
        <View style={[styles.severityDot, { backgroundColor: color }]} />
        <Text style={[styles.title, { color: themeColors.text }]}>{alert.title}</Text>
      </View>
      <Text style={[styles.description, { color: themeColors.textSecondary }]}>{alert.description}</Text>
      {onAction && (
        <AppButton
          title={alert.actionLabel}
          onPress={onAction}
          variant="outline"
          style={styles.button}
          textStyle={styles.buttonText}
        />
      )}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  severityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  description: {
    fontSize: 14,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  button: {
    minHeight: 40,
    paddingVertical: spacing.sm,
  },
  buttonText: {
    fontSize: 14,
  },
});
