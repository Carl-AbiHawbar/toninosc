import { BranchOrder } from '@/types';
import { getDateKey } from '@/utils/helpers';

const demoToday = getDateKey();

export const mockOrders: BranchOrder[] = [
  {
    id: 'order-1',
    orderNumber: 'ORD-1001',
    branchId: 'branch-1',
    createdByUserId: 'user-2',
    status: 'delivered',
    createdAt: '2026-06-10T09:00:00',
    updatedAt: '2026-06-11T14:00:00',
    lines: [
      { id: 'line-1', stockItemId: 'stock-1', quantity: 5, unitPrice: 45 },
      { id: 'line-2', stockItemId: 'stock-2', quantity: 8, unitPrice: 12 },
      { id: 'line-3', stockItemId: 'stock-12', quantity: 6, unitPrice: 20 },
      { id: 'line-4', stockItemId: 'stock-16', quantity: 10, unitPrice: 6 },
    ],
    notes: 'Regular weekly order',
    deliveryId: 'delivery-1',
    invoiceId: 'invoice-1',
  },
  {
    id: 'order-2',
    orderNumber: 'ORD-1002',
    branchId: 'branch-2',
    createdByUserId: 'user-3',
    status: 'out_for_delivery',
    createdAt: '2026-06-15T10:30:00',
    updatedAt: '2026-06-16T08:00:00',
    lines: [
      { id: 'line-5', stockItemId: 'stock-1', quantity: 4, unitPrice: 45 },
      { id: 'line-6', stockItemId: 'stock-4', quantity: 3, unitPrice: 22 },
      { id: 'line-7', stockItemId: 'stock-6', quantity: 12, unitPrice: 3 },
      { id: 'line-8', stockItemId: 'stock-15', quantity: 8, unitPrice: 8 },
    ],
    assignedDriverId: 'user-7',
    deliveryId: 'delivery-2',
  },
  {
    id: 'order-3',
    orderNumber: 'ORD-1003',
    branchId: 'branch-1',
    createdByUserId: 'user-2',
    status: 'submitted',
    createdAt: `${demoToday}T08:00:00`,
    updatedAt: `${demoToday}T08:00:00`,
    lines: [
      { id: 'line-9', stockItemId: 'stock-3', quantity: 6, unitPrice: 18 },
      { id: 'line-10', stockItemId: 'stock-7', quantity: 5, unitPrice: 8 },
      { id: 'line-11', stockItemId: 'stock-13', quantity: 4, unitPrice: 18 },
    ],
  },
  {
    id: 'order-4',
    orderNumber: 'ORD-1004',
    branchId: 'branch-3',
    createdByUserId: 'user-4',
    status: 'preparing',
    createdAt: `${demoToday}T07:00:00`,
    updatedAt: `${demoToday}T09:00:00`,
    lines: [
      { id: 'line-12', stockItemId: 'stock-1', quantity: 3, unitPrice: 45 },
      { id: 'line-13', stockItemId: 'stock-8', quantity: 4, unitPrice: 14 },
      { id: 'line-14', stockItemId: 'stock-19', quantity: 6, unitPrice: 3 },
    ],
  },
  {
    id: 'order-5',
    orderNumber: 'ORD-1005',
    branchId: 'branch-4',
    createdByUserId: 'user-5',
    status: 'approved',
    createdAt: `${demoToday}T06:00:00`,
    updatedAt: `${demoToday}T07:30:00`,
    lines: [
      { id: 'line-15', stockItemId: 'stock-1', quantity: 6, unitPrice: 45 },
      { id: 'line-16', stockItemId: 'stock-2', quantity: 10, unitPrice: 12 },
      { id: 'line-17', stockItemId: 'stock-14', quantity: 15, unitPrice: 5 },
    ],
  },
  {
    id: 'order-6',
    orderNumber: 'ORD-1006',
    branchId: 'branch-2',
    createdByUserId: 'user-3',
    status: 'invoiced',
    createdAt: '2026-06-08T11:00:00',
    updatedAt: '2026-06-09T16:00:00',
    lines: [
      { id: 'line-18', stockItemId: 'stock-12', quantity: 8, unitPrice: 20 },
      { id: 'line-19', stockItemId: 'stock-16', quantity: 12, unitPrice: 6 },
    ],
    invoiceId: 'invoice-2',
  },
  {
    id: 'order-7',
    orderNumber: 'ORD-1007',
    branchId: 'branch-1',
    createdByUserId: 'user-2',
    status: 'problem',
    createdAt: '2026-06-05T09:00:00',
    updatedAt: '2026-06-06T10:00:00',
    lines: [
      { id: 'line-20', stockItemId: 'stock-6', quantity: 10, unitPrice: 3, note: 'Some bananas were bruised' },
    ],
    notes: 'Quality issue reported',
  },
];

/** Last completed order for branch-1 — used for "Repeat Last Order" */
export function getLastOrderForBranch(branchId: string): BranchOrder | undefined {
  return mockOrders
    .filter((o) => o.branchId === branchId && o.status !== 'draft')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
}

export function calculateOrderTotal(order: BranchOrder): number {
  return order.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
}

export function getOrderItemCount(order: BranchOrder): number {
  return order.lines.reduce((sum, line) => sum + line.quantity, 0);
}
