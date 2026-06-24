import { BranchOrder } from '@/types';

export const mockOrders: BranchOrder[] = [];

export function getLastOrderForBranch(branchId: string): BranchOrder | undefined {
  return mockOrders
    .filter((order) => order.branchId === branchId && order.status !== 'draft')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
}

export function calculateOrderTotal(order: BranchOrder): number {
  return order.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
}

export function getOrderItemCount(order: BranchOrder): number {
  return order.lines.reduce((sum, line) => sum + line.quantity, 0);
}
