import { View, Text, StyleSheet } from 'react-native';
import { Alert, AlertSeverity } from '@/types';
import { AppCard } from './AppCard';
import { AppButton } from './AppButton';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

interface AlertCardProps {
  alert: Alert;
  onAction?: () => void;
}

const severityColors: Record<AlertSeverity, string> = {
  info: colors.info,
  warning: colors.warning,
  critical: colors.error,
};

export function AlertCard({ alert, onAction }: AlertCardProps) {
  const color = severityColors[alert.severity];

  return (
    <AppCard style={[styles.card, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <View style={styles.header}>
        <View style={[styles.severityDot, { backgroundColor: color }]} />
        <Text style={styles.title}>{alert.title}</Text>
      </View>
      <Text style={styles.description}>{alert.description}</Text>
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
    color: colors.text,
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
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
