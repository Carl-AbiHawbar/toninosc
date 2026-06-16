import { Invoice } from '@/types';

export const mockInvoices: Invoice[] = [
  {
    id: 'invoice-1',
    invoiceNumber: 'INV-2026-001',
    branchId: 'branch-1',
    orderId: 'order-1',
    date: '2026-06-11',
    lines: [
      { id: 'inv-line-1', stockItemId: 'stock-1', name: 'Nutella Bucket', quantity: 5, unit: 'bucket', unitPrice: 45, total: 225 },
      { id: 'inv-line-2', stockItemId: 'stock-2', name: 'Lotus Spread', quantity: 8, unit: 'jar', unitPrice: 12, total: 96 },
      { id: 'inv-line-3', stockItemId: 'stock-12', name: 'Crepe Dough Mix', quantity: 6, unit: 'bag', unitPrice: 20, total: 120 },
      { id: 'inv-line-4', stockItemId: 'stock-16', name: 'Crepe Boxes', quantity: 10, unit: 'pack', unitPrice: 6, total: 60 },
    ],
    subtotal: 501,
    discount: 25,
    deliveryFee: 15,
    tax: 47.6,
    grandTotal: 538.6,
    paymentStatus: 'paid',
  },
  {
    id: 'invoice-2',
    invoiceNumber: 'INV-2026-002',
    branchId: 'branch-2',
    orderId: 'order-6',
    date: '2026-06-09',
    lines: [
      { id: 'inv-line-5', stockItemId: 'stock-12', name: 'Crepe Dough Mix', quantity: 8, unit: 'bag', unitPrice: 20, total: 160 },
      { id: 'inv-line-6', stockItemId: 'stock-16', name: 'Crepe Boxes', quantity: 12, unit: 'pack', unitPrice: 6, total: 72 },
    ],
    subtotal: 232,
    discount: 0,
    deliveryFee: 15,
    tax: 22.05,
    grandTotal: 269.05,
    paymentStatus: 'unpaid',
  },
  {
    id: 'invoice-3',
    invoiceNumber: 'INV-2026-003',
    branchId: 'branch-3',
    orderId: 'order-7',
    date: '2026-06-06',
    lines: [
      { id: 'inv-line-7', stockItemId: 'stock-6', name: 'Banana', quantity: 10, unit: 'kg', unitPrice: 3, total: 30 },
    ],
    subtotal: 30,
    discount: 5,
    deliveryFee: 10,
    tax: 2.85,
    grandTotal: 37.85,
    paymentStatus: 'overdue',
  },
  {
    id: 'invoice-4',
    invoiceNumber: 'INV-2026-004',
    branchId: 'branch-4',
    orderId: 'order-5',
    date: '2026-06-16',
    lines: [
      { id: 'inv-line-8', stockItemId: 'stock-1', name: 'Nutella Bucket', quantity: 6, unit: 'bucket', unitPrice: 45, total: 270 },
      { id: 'inv-line-9', stockItemId: 'stock-2', name: 'Lotus Spread', quantity: 10, unit: 'jar', unitPrice: 12, total: 120 },
      { id: 'inv-line-10', stockItemId: 'stock-14', name: 'Water Bottles', quantity: 15, unit: 'case', unitPrice: 5, total: 75 },
    ],
    subtotal: 465,
    discount: 0,
    deliveryFee: 20,
    tax: 44.18,
    grandTotal: 529.18,
    paymentStatus: 'unpaid',
  },
];

export function getInvoicesForBranch(branchId: string): Invoice[] {
  return mockInvoices.filter((inv) => inv.branchId === branchId);
}
