import { InventoryBalance, InventoryStatus, StockMovement } from '@/types';
import { mockStockItems } from './mockStockItems';
import { getEarliestExpiry, mockStockBatches } from './mockStockBatches';

function getMinimumStock(index: number, averageOrderQty: number) {
  return Math.max(6, Math.ceil(averageOrderQty * 1.5), index % 4 === 0 ? 10 : 0);
}

function getStatus(currentStock: number, minimumStock: number, expiryDate?: string): InventoryStatus {
  if (currentStock <= 0 || currentStock <= minimumStock / 2) return 'critical';
  if (currentStock <= minimumStock) return 'low';

  if (expiryDate) {
    const expiry = new Date(`${expiryDate}T00:00:00`).getTime();
    const today = new Date('2026-06-22T00:00:00').getTime();
    const daysUntilExpiry = (expiry - today) / (1000 * 60 * 60 * 24);
    if (daysUntilExpiry <= 30) return 'expiring_soon';
  }

  return 'ok';
}

export const mockInventory: InventoryBalance[] = mockStockItems.map((item, index) => {
  const itemBatches = mockStockBatches.filter((batch) => batch.stockItemId === item.id);
  const currentStock = itemBatches.reduce((sum, batch) => sum + batch.currentQuantity, 0);
  const minimumStock = getMinimumStock(index, item.averageOrderQty);
  const expiryDate = getEarliestExpiry(item.id);

  return {
    id: `inv-${item.id.replace('stock-', '')}`,
    stockItemId: item.id,
    warehouseId: 'warehouse-1',
    currentStock,
    minimumStock,
    expiryDate,
    status: getStatus(currentStock, minimumStock, expiryDate),
  };
});

export const mockStockMovements: StockMovement[] = [
  {
    id: 'mov-1',
    stockItemId: 'stock-1',
    warehouseId: 'warehouse-1',
    type: 'receive',
    quantity: 10,
    date: '2026-06-15',
    batchId: 'batch-stock-1-B',
    batchNumber: 'TN-001-B',
    note: 'Supplier delivery',
  },
  {
    id: 'mov-2',
    stockItemId: 'stock-3',
    warehouseId: 'warehouse-1',
    type: 'pick',
    quantity: -6,
    date: '2026-06-15',
    batchId: 'batch-stock-3-A',
    batchNumber: 'TN-003-A',
    orderId: 'order-3',
    branchId: 'branch-1',
    note: 'Order ORD-1003',
  },
];

export function getInventoryForItem(stockItemId: string): InventoryBalance | undefined {
  return mockInventory.find((inv) => inv.stockItemId === stockItemId);
}
