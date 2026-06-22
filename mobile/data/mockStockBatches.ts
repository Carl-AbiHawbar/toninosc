import { StockBatch } from '@/types';
import { mockStockItems } from './mockStockItems';

const warehouseId = 'warehouse-1';

function getShelfLifeMonths(category: string) {
  if (category === 'Dough & bases') return 6;
  if (category === 'Savory ingredients') return 4;
  if (category === 'Packaging' || category === 'Cleaning & disposables') return 36;
  return 12;
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addMonths(date: Date, months: number) {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

function buildBatch(stockItemId: string, index: number, suffix: string, quantity: number, monthsOffset = 0): StockBatch {
  const item = mockStockItems.find((stock) => stock.id === stockItemId)!;
  const productionDate = addMonths(new Date('2026-01-10'), monthsOffset);
  const expiryDate = addMonths(productionDate, getShelfLifeMonths(item.category));

  return {
    id: `batch-${stockItemId}-${suffix}`,
    stockItemId,
    warehouseId,
    batchNumber: `TN-${String(index + 1).padStart(3, '0')}-${suffix.toUpperCase()}`,
    productionDate: formatDate(productionDate),
    expiryDate: formatDate(expiryDate),
    receivedDate: '2026-06-15',
    originalQuantity: quantity,
    currentQuantity: quantity,
    supplierId: item.supplierId,
  };
}

export const mockStockBatches: StockBatch[] = mockStockItems.flatMap((item, index) => {
  const baseQuantity = Math.max(item.averageOrderQty * 4, 12);

  if (index < 8) {
    return [
      buildBatch(item.id, index, 'A', Math.ceil(baseQuantity / 2), -2),
      buildBatch(item.id, index, 'B', Math.ceil(baseQuantity / 2), 0),
    ];
  }

  return [buildBatch(item.id, index, 'A', baseQuantity, 0)];
});

export function getBatchesForItem(stockItemId: string, batches = mockStockBatches) {
  return batches
    .filter((batch) => batch.stockItemId === stockItemId && batch.currentQuantity > 0)
    .sort((a, b) => (a.expiryDate ?? '9999-12-31').localeCompare(b.expiryDate ?? '9999-12-31'));
}

export function getEarliestExpiry(stockItemId: string, batches = mockStockBatches) {
  return getBatchesForItem(stockItemId, batches)[0]?.expiryDate;
}
