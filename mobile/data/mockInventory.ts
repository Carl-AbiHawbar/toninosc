import { InventoryBalance, StockMovement } from '@/types';

export const mockInventory: InventoryBalance[] = [
  { id: 'inv-1', stockItemId: 'stock-1', warehouseId: 'warehouse-1', currentStock: 12, minimumStock: 10, status: 'ok' },
  { id: 'inv-2', stockItemId: 'stock-2', warehouseId: 'warehouse-1', currentStock: 45, minimumStock: 20, status: 'ok' },
  { id: 'inv-3', stockItemId: 'stock-3', warehouseId: 'warehouse-1', currentStock: 8, minimumStock: 15, status: 'low' },
  { id: 'inv-4', stockItemId: 'stock-4', warehouseId: 'warehouse-1', currentStock: 3, minimumStock: 8, status: 'critical' },
  { id: 'inv-5', stockItemId: 'stock-5', warehouseId: 'warehouse-1', currentStock: 20, minimumStock: 5, status: 'ok' },
  { id: 'inv-6', stockItemId: 'stock-6', warehouseId: 'warehouse-1', currentStock: 25, minimumStock: 10, expiryDate: '2026-06-20', status: 'expiring_soon' },
  { id: 'inv-7', stockItemId: 'stock-7', warehouseId: 'warehouse-1', currentStock: 6, minimumStock: 8, expiryDate: '2026-06-18', status: 'expiring_soon' },
  { id: 'inv-8', stockItemId: 'stock-8', warehouseId: 'warehouse-1', currentStock: 30, minimumStock: 10, status: 'ok' },
  { id: 'inv-9', stockItemId: 'stock-9', warehouseId: 'warehouse-1', currentStock: 18, minimumStock: 8, status: 'ok' },
  { id: 'inv-10', stockItemId: 'stock-10', warehouseId: 'warehouse-1', currentStock: 22, minimumStock: 10, status: 'ok' },
  { id: 'inv-11', stockItemId: 'stock-11', warehouseId: 'warehouse-1', currentStock: 4, minimumStock: 5, status: 'low' },
  { id: 'inv-12', stockItemId: 'stock-12', warehouseId: 'warehouse-1', currentStock: 35, minimumStock: 15, status: 'ok' },
  { id: 'inv-13', stockItemId: 'stock-13', warehouseId: 'warehouse-1', currentStock: 28, minimumStock: 12, status: 'ok' },
  { id: 'inv-14', stockItemId: 'stock-14', warehouseId: 'warehouse-1', currentStock: 50, minimumStock: 20, status: 'ok' },
  { id: 'inv-15', stockItemId: 'stock-15', warehouseId: 'warehouse-1', currentStock: 40, minimumStock: 15, status: 'ok' },
  { id: 'inv-16', stockItemId: 'stock-16', warehouseId: 'warehouse-1', currentStock: 60, minimumStock: 25, status: 'ok' },
  { id: 'inv-17', stockItemId: 'stock-17', warehouseId: 'warehouse-1', currentStock: 55, minimumStock: 20, status: 'ok' },
  { id: 'inv-18', stockItemId: 'stock-18', warehouseId: 'warehouse-1', currentStock: 70, minimumStock: 30, status: 'ok' },
  { id: 'inv-19', stockItemId: 'stock-19', warehouseId: 'warehouse-1', currentStock: 80, minimumStock: 30, status: 'ok' },
  { id: 'inv-20', stockItemId: 'stock-20', warehouseId: 'warehouse-1', currentStock: 65, minimumStock: 25, status: 'ok' },
  { id: 'inv-21', stockItemId: 'stock-21', warehouseId: 'warehouse-1', currentStock: 15, minimumStock: 8, status: 'ok' },
  { id: 'inv-22', stockItemId: 'stock-22', warehouseId: 'warehouse-1', currentStock: 30, minimumStock: 10, status: 'ok' },
  { id: 'inv-23', stockItemId: 'stock-23', warehouseId: 'warehouse-1', currentStock: 12, minimumStock: 6, status: 'ok' },
  { id: 'inv-24', stockItemId: 'stock-24', warehouseId: 'warehouse-1', currentStock: 5, minimumStock: 10, status: 'low' },
  { id: 'inv-25', stockItemId: 'stock-25', warehouseId: 'warehouse-1', currentStock: 2, minimumStock: 8, status: 'critical' },
];

export const mockStockMovements: StockMovement[] = [
  { id: 'mov-1', stockItemId: 'stock-1', warehouseId: 'warehouse-1', type: 'receive', quantity: 10, date: '2026-06-14', note: 'Supplier delivery' },
  { id: 'mov-2', stockItemId: 'stock-3', warehouseId: 'warehouse-1', type: 'pick', quantity: -6, date: '2026-06-15', note: 'Order ORD-1001' },
  { id: 'mov-3', stockItemId: 'stock-6', warehouseId: 'warehouse-1', type: 'receive', quantity: 15, date: '2026-06-15', note: 'Fresh fruits delivery' },
  { id: 'mov-4', stockItemId: 'stock-4', warehouseId: 'warehouse-1', type: 'pick', quantity: -3, date: '2026-06-16', note: 'Order ORD-1002' },
];

export function getInventoryForItem(stockItemId: string): InventoryBalance | undefined {
  return mockInventory.find((inv) => inv.stockItemId === stockItemId);
}
