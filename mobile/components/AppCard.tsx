import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useApp } from '@/context/AppContext';
import { borderRadius, spacing } from '@/theme/spacing';

interface AppCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: 'sm' | 'md' | 'lg';
}

export function AppCard({ children, style, padding = 'md' }: AppCardProps) {
  const { themeColors, themeMode } = useApp();
  const paddingValue = padding === 'sm' ? spacing.sm : padding === 'lg' ? spacing.lg : spacing.md;

  return (
    <View
      style={[
        styles.card,
        {
          padding: paddingValue,
          backgroundColor: themeColors.card,
          borderColor: themeColors.border,
          shadowOpacity: themeMode === 'dark' ? 0 : 0.025,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.025,
    shadowRadius: 3,
    elevation: 1,
  },
});
