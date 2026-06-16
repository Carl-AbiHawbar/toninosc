import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors } from '@/theme/colors';
import { borderRadius, spacing } from '@/theme/spacing';

interface AppCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: 'sm' | 'md' | 'lg';
}

export function AppCard({ children, style, padding = 'md' }: AppCardProps) {
  const paddingValue = padding === 'sm' ? spacing.sm : padding === 'lg' ? spacing.lg : spacing.md;

  return (
    <View style={[styles.card, { padding: paddingValue }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
});
