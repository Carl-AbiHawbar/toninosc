import { Invoice } from '@/types';

export const mockInvoices: Invoice[] = [];

export function getInvoicesForBranch(branchId: string): Invoice[] {
  return mockInvoices.filter((invoice) => invoice.branchId === branchId);
}
