import { Language, StockItem } from '@/types';
import { categoryLabelsByLanguage } from '@/i18n/translations';

const itemNameAr: Record<string, string> = {
  'Nutella Spread': 'دهن نوتيلا',
  'White Spread': 'دهن أبيض',
  'Lotus Spread': 'دهن لوتس',
  'Pistachio Spread': 'دهن فستق',
  'Dark Chocolate Spread': 'دهن شوكولا داكنة',
  'Hazelnuts Chocolate Spread': 'دهن شوكولا بالبندق',
  'Peanut Butter Spread': 'زبدة الفول السوداني',
  'Kinder Chocolate': 'شوكولا كيندر',
  'Crepe Dough Mix': 'خلطة عجينة الكريب',
  'Waffle Dough Mix': 'خلطة عجينة الوافل',
  'Crepe Plate': 'صحن كريب',
  'Crepe Cover': 'غطاء كريب',
  'Waffle Plate': 'صحن وافل',
  'Waffle Cover': 'غطاء وافل',
  Bowls: 'أوعية',
  'Hazelnuts Syrup': 'سيروب بندق',
  'White Syrup': 'سيروب أبيض',
  'Lotus Syrup': 'سيروب لوتس',
  'Pistachio Syrup': 'سيروب فستق',
  'Caramel Syrup': 'سيروب كراميل',
  'Strawberry Syrup': 'سيروب فراولة',
  'Mapel Syrup': 'سيروب مابل',
  Forks: 'شوك',
  Knives: 'سكاكين',
  Spoons: 'ملاعق',
  'Plastic Bag': 'كيس بلاستيك',
  'Cartoon Bag': 'كرتون أكياس',
  Napkins: 'محارم',
  'Wet Napkins': 'محارم مبللة',
  'Brownies Crumble': 'فتات براونيز',
  'Cookies Vanilla Crumble': 'فتات كوكيز فانيلا',
  'Cookies Chocolate Crumble': 'فتات كوكيز شوكولا',
  'Lotus Crumble': 'فتات لوتس',
  'Oreo Crumble': 'فتات أوريو',
  Knefe: 'كنافة',
  Osmaliye: 'عثملية',
  Nuts: 'مكسرات',
  'Chocolate Chips': 'حبيبات شوكولا',
  'Oreo Biscuits': 'بسكويت أوريو',
  'Digestive Biscuits': 'بسكويت دايجستف',
  Smarties: 'سمارتيز',
  Marshmallow: 'مارشميلو',
  'Mozzarella Cheese': 'جبنة موزاريلا',
  'Mixed Cheese': 'خلطة أجبان',
  Turkey: 'حبش',
  'Receipt Rolls': 'رولات فواتير',
};

const unitAr: Record<string, string> = {
  bucket: 'دلو',
  piece: 'قطعة',
  box: 'علبة',
  kg: 'كغ',
  pack: 'حزمة',
  bottle: 'عبوة',
  bag: 'كيس',
  'pack / 50 pieces': 'حزمة / 50 قطعة',
  'pack / 100 pieces': 'حزمة / 100 قطعة',
  'box / 300 pieces': 'علبة / 300 قطعة',
  'pack / 2kg': 'حزمة / 2 كغ',
};

export function getStockItemName(item: Pick<StockItem, 'name'> | undefined, language: Language) {
  if (!item) return language === 'ar' ? 'مادة' : 'Item';
  return language === 'ar' ? itemNameAr[item.name] ?? item.name : item.name;
}

export function getStockItemUnit(item: Pick<StockItem, 'unit'> | undefined, language: Language) {
  if (!item) return '';
  return language === 'ar' ? unitAr[item.unit] ?? item.unit : item.unit;
}

export function getStockItemCategory(item: Pick<StockItem, 'category'> | undefined, language: Language) {
  if (!item) return '';
  return categoryLabelsByLanguage[language][item.category] ?? item.category;
}

export function getStockItemSearchText(item: Pick<StockItem, 'name' | 'category' | 'unit'>, language: Language) {
  return [
    item.name,
    item.category,
    item.unit,
    getStockItemName(item, language),
    getStockItemCategory(item, language),
    getStockItemUnit(item, language),
  ]
    .join(' ')
    .toLowerCase();
}
