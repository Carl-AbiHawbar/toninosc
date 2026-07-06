import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StockItem } from '@/types';
import { AppCard } from './AppCard';
import { QuantityStepper } from './QuantityStepper';
import { useApp } from '@/context/AppContext';
import { colors } from '@/theme/colors';
import { borderRadius, spacing } from '@/theme/spacing';
import { formatCurrency } from '@/utils/helpers';
import { getStockItemName, getStockItemUnit } from '@/utils/stockLocalization';

interface ProductCardProps {
  item: StockItem;
  quantity: number;
  warehouseStock: number;
  onQuantityChange: (qty: number) => void;
  onNotePress?: () => void;
  hasNote?: boolean;
  showWarning?: boolean;
}

export function ProductCard({
  item,
  quantity,
  warehouseStock,
  onQuantityChange,
  onNotePress,
  hasNote,
  showWarning,
}: ProductCardProps) {
  const { language, t, themeColors } = useApp();
  const isArabic = language === 'ar';
  const stockColor =
    warehouseStock <= 5 ? themeColors.error : warehouseStock <= 15 ? themeColors.warning : themeColors.success;
  const itemName = getStockItemName(item, language);
  const itemUnit = getStockItemUnit(item, language);

  return (
    <AppCard style={[styles.card, showWarning && styles.warningBorder]}>
      {showWarning && (
        <View style={styles.warningBanner}>
          <Text style={[styles.warningText, { color: themeColors.warning }, isArabic && styles.rtlText]}>! {t('highQuantity')}</Text>
        </View>
      )}
      <View style={styles.row}>
        <View style={[styles.emojiBox, { backgroundColor: themeColors.background }]}>
          <Text style={styles.emoji}>{item.imageEmoji}</Text>
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: themeColors.text }, isArabic && styles.rtlText]}>{itemName}</Text>
          <Text style={[styles.unit, { color: themeColors.textSecondary }, isArabic && styles.rtlText]}>
            {itemUnit} - {formatCurrency(item.price)}
          </Text>
          <View style={[styles.stockRow, isArabic && styles.rowRtl]}>
            <View style={[styles.stockDot, { backgroundColor: stockColor }]} />
            <Text style={[styles.stockText, { color: stockColor }, isArabic && styles.rtlText]}>
              {t('inWarehouse', { count: warehouseStock })}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.actions}>
        <QuantityStepper
          quantity={quantity}
          onIncrease={() => onQuantityChange(quantity + 1)}
          onDecrease={() => onQuantityChange(Math.max(0, quantity - 1))}
        />
        {onNotePress && (
          <TouchableOpacity style={styles.noteBtn} onPress={onNotePress}>
            <Text style={[styles.noteBtnText, { color: themeColors.primary }]}>{hasNote ? t('noteSaved') : t('note')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  warningBorder: {
    borderColor: colors.warning,
    borderWidth: 2,
  },
  warningBanner: {
    backgroundColor: colors.warning + '20',
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  warningText: {
    color: colors.warning,
    fontWeight: '600',
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  rowRtl: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-end',
  },
  emojiBox: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  emoji: {
    fontSize: 36,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  unit: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  stockText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noteBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  noteBtnText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
