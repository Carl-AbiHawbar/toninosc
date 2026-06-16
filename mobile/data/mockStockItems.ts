import { StockItem } from '@/types';

export const mockStockItems: StockItem[] = [
  { id: 'stock-1', name: 'Nutella Bucket', category: 'Chocolate & spreads', unit: 'bucket', price: 45, imageEmoji: '🍫', averageOrderQty: 5, supplierId: 'supplier-1' },
  { id: 'stock-2', name: 'Lotus Spread', category: 'Chocolate & spreads', unit: 'jar', price: 12, imageEmoji: '🍪', averageOrderQty: 8, supplierId: 'supplier-1' },
  { id: 'stock-3', name: 'Kinder Chocolate', category: 'Chocolate & spreads', unit: 'box', price: 18, imageEmoji: '🎁', averageOrderQty: 6, supplierId: 'supplier-1' },
  { id: 'stock-4', name: 'Pistachio Cream', category: 'Chocolate & spreads', unit: 'jar', price: 22, imageEmoji: '🟢', averageOrderQty: 4, supplierId: 'supplier-1' },
  { id: 'stock-5', name: 'Osmaliye', category: 'Chocolate & spreads', unit: 'kg', price: 15, imageEmoji: '🍯', averageOrderQty: 3, supplierId: 'supplier-1' },
  { id: 'stock-6', name: 'Banana', category: 'Fruits', unit: 'kg', price: 3, imageEmoji: '🍌', averageOrderQty: 10, supplierId: 'supplier-2' },
  { id: 'stock-7', name: 'Strawberry', category: 'Fruits', unit: 'kg', price: 8, imageEmoji: '🍓', averageOrderQty: 8, supplierId: 'supplier-2' },
  { id: 'stock-8', name: 'Cheese', category: 'Savory ingredients', unit: 'kg', price: 14, imageEmoji: '🧀', averageOrderQty: 5, supplierId: 'supplier-2' },
  { id: 'stock-9', name: 'Turkey', category: 'Savory ingredients', unit: 'kg', price: 16, imageEmoji: '🦃', averageOrderQty: 4, supplierId: 'supplier-2' },
  { id: 'stock-10', name: 'Hot Dog', category: 'Savory ingredients', unit: 'pack', price: 9, imageEmoji: '🌭', averageOrderQty: 6, supplierId: 'supplier-2' },
  { id: 'stock-11', name: 'Mushrooms', category: 'Savory ingredients', unit: 'kg', price: 7, imageEmoji: '🍄', averageOrderQty: 3, supplierId: 'supplier-2' },
  { id: 'stock-12', name: 'Crepe Dough Mix', category: 'Dough & bases', unit: 'bag', price: 20, imageEmoji: '🥞', averageOrderQty: 8, supplierId: 'supplier-3' },
  { id: 'stock-13', name: 'Waffle Mix', category: 'Dough & bases', unit: 'bag', price: 18, imageEmoji: '🧇', averageOrderQty: 6, supplierId: 'supplier-3' },
  { id: 'stock-14', name: 'Water Bottles', category: 'Drinks', unit: 'case', price: 5, imageEmoji: '💧', averageOrderQty: 12, supplierId: 'supplier-4' },
  { id: 'stock-15', name: 'Soft Drinks', category: 'Drinks', unit: 'case', price: 8, imageEmoji: '🥤', averageOrderQty: 10, supplierId: 'supplier-4' },
  { id: 'stock-16', name: 'Crepe Boxes', category: 'Packaging', unit: 'pack', price: 6, imageEmoji: '📦', averageOrderQty: 15, supplierId: 'supplier-3' },
  { id: 'stock-17', name: 'Waffle Boxes', category: 'Packaging', unit: 'pack', price: 6, imageEmoji: '📦', averageOrderQty: 12, supplierId: 'supplier-3' },
  { id: 'stock-18', name: 'Bowls', category: 'Packaging', unit: 'pack', price: 4, imageEmoji: '🥣', averageOrderQty: 10, supplierId: 'supplier-3' },
  { id: 'stock-19', name: 'Napkins', category: 'Packaging', unit: 'pack', price: 3, imageEmoji: '🧻', averageOrderQty: 8, supplierId: 'supplier-3' },
  { id: 'stock-20', name: 'Spoons', category: 'Packaging', unit: 'pack', price: 2, imageEmoji: '🥄', averageOrderQty: 8, supplierId: 'supplier-3' },
  { id: 'stock-21', name: 'Gloves', category: 'Cleaning & disposables', unit: 'box', price: 5, imageEmoji: '🧤', averageOrderQty: 4, supplierId: 'supplier-3' },
  { id: 'stock-22', name: 'Receipt Rolls', category: 'Cleaning & disposables', unit: 'pack', price: 3, imageEmoji: '🧾', averageOrderQty: 6, supplierId: 'supplier-3' },
  { id: 'stock-23', name: 'Cleaning Spray', category: 'Cleaning & disposables', unit: 'bottle', price: 4, imageEmoji: '🧴', averageOrderQty: 3, supplierId: 'supplier-3' },
  { id: 'stock-24', name: 'Whipped Cream', category: 'Add-ons', unit: 'can', price: 6, imageEmoji: '🍦', averageOrderQty: 8, supplierId: 'supplier-2' },
  { id: 'stock-25', name: 'Chocolate Sauce', category: 'Add-ons', unit: 'bottle', price: 7, imageEmoji: '🍫', averageOrderQty: 5, supplierId: 'supplier-1' },
];

export const stockCategories = [
  'All',
  'Chocolate & spreads',
  'Fruits',
  'Savory ingredients',
  'Dough & bases',
  'Drinks',
  'Packaging',
  'Cleaning & disposables',
  'Add-ons',
] as const;

export function getStockItemById(id: string): StockItem | undefined {
  return mockStockItems.find((item) => item.id === id);
}
