import { BranchOrder } from '@/types';

export function calculateOrderTotal(order: BranchOrder): number {
  return order.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
}

export function getOrderItemCount(order: BranchOrder): number {
  return order.lines.reduce((sum, line) => sum + line.quantity, 0);
}
