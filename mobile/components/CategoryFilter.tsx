import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { borderRadius, spacing } from '@/theme/spacing';

interface CategoryFilterProps {
  categories: readonly string[];
  selected: string;
  onSelect: (category: string) => void;
}

export function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.content}
    >
      {categories.map((cat) => {
        const isSelected = cat === selected;
        return (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onSelect(cat)}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {cat}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    marginBottom: spacing.sm,
    maxHeight: 44,
  },
  content: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  chipTextSelected: {
    color: colors.white,
  },
});
