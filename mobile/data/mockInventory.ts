import { InventoryBalance, StockMovement } from '@/types';

export const mockInventory: InventoryBalance[] = [];

export const mockStockMovements: StockMovement[] = [];

export function getInventoryForItem(stockItemId: string): InventoryBalance | undefined {
  return mockInventory.find((inv) => inv.stockItemId === stockItemId);
}
