import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useApp } from '@/context/AppContext';
import { categoryLabelsByLanguage, inventoryFilterLabelsByLanguage } from '@/i18n/translations';
import { colors } from '@/theme/colors';
import { borderRadius, spacing } from '@/theme/spacing';

interface CategoryFilterProps {
  categories: readonly string[];
  selected: string;
  onSelect: (category: string) => void;
}

export function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  const { language, themeColors } = useApp();
  const getLabel = (cat: string) =>
    categoryLabelsByLanguage[language][cat] ?? inventoryFilterLabelsByLanguage[language][cat] ?? cat;

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
            style={[
              styles.chip,
              { backgroundColor: themeColors.card, borderColor: themeColors.border },
              isSelected && { backgroundColor: themeColors.primary, borderColor: themeColors.primary },
            ]}
            onPress={() => onSelect(cat)}
          >
            <Text style={[styles.chipText, { color: themeColors.text }, isSelected && styles.chipTextSelected]}>
              {getLabel(cat)}
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
    minHeight: 48,
  },
  content: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 2,
    paddingRight: spacing.md,
  },
  chip: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.text,
  },
  chipTextSelected: {
    color: colors.white,
  },
});
