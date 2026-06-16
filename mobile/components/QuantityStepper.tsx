import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { borderRadius, spacing, touchTarget } from '@/theme/spacing';

interface QuantityStepperProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  min?: number;
  max?: number;
}

export function QuantityStepper({
  quantity,
  onIncrease,
  onDecrease,
  min = 0,
  max = 999,
}: QuantityStepperProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, quantity <= min && styles.buttonDisabled]}
        onPress={onDecrease}
        disabled={quantity <= min}
      >
        <Text style={styles.buttonText}>−</Text>
      </TouchableOpacity>
      <Text style={styles.quantity}>{quantity}</Text>
      <TouchableOpacity
        style={[styles.button, quantity >= max && styles.buttonDisabled]}
        onPress={onIncrease}
        disabled={quantity >= max}
      >
        <Text style={styles.buttonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  button: {
    width: touchTarget.minWidth,
    height: touchTarget.minHeight,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: colors.border,
  },
  buttonText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
  },
  quantity: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    minWidth: 36,
    textAlign: 'center',
  },
});
