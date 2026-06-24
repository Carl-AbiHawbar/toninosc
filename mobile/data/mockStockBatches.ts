import { StockBatch } from '@/types';

export const mockStockBatches: StockBatch[] = [];

export function getBatchesForItem(stockItemId: string, batches = mockStockBatches) {
  return batches
    .filter((batch) => batch.stockItemId === stockItemId && batch.currentQuantity > 0)
    .sort((a, b) => (a.expiryDate ?? '9999-12-31').localeCompare(b.expiryDate ?? '9999-12-31'));
}

export function getEarliestExpiry(stockItemId: string, batches = mockStockBatches) {
  return getBatchesForItem(stockItemId, batches)[0]?.expiryDate;
}
