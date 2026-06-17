import { OrderStatus } from '@/types';
import { AppColors, colors } from '@/theme/colors';

export const orderStatusLabels: Record<OrderStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  preparing: 'Preparing',
  packed: 'Packed',
  assigned_to_driver: 'Assigned to Driver',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  invoiced: 'Invoiced',
  paid: 'Paid',
  problem: 'Problem',
};

export function getStatusColor(status: OrderStatus, palette: AppColors = colors): string {
  switch (status) {
    case 'draft':
      return palette.statusDraft;
    case 'submitted':
    case 'assigned_to_driver':
      return palette.statusSubmitted;
    case 'approved':
    case 'delivered':
    case 'paid':
      return palette.statusApproved;
    case 'preparing':
    case 'packed':
    case 'out_for_delivery':
      return palette.statusPreparing;
    case 'invoiced':
      return palette.info;
    case 'problem':
      return palette.statusProblem;
    default:
      return palette.textSecondary;
  }
}

export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function getDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getMonthKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function generateOrderNumber(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${num}`;
}

export function getInventoryStatusLabel(status: string): string {
  switch (status) {
    case 'ok':
      return 'OK';
    case 'low':
      return 'Low';
    case 'critical':
      return 'Critical';
    case 'expiring_soon':
      return 'Expiring Soon';
    default:
      return status;
  }
}

export function getInventoryStatusColor(status: string, palette: AppColors = colors): string {
  switch (status) {
    case 'ok':
      return palette.success;
    case 'low':
      return palette.warning;
    case 'critical':
      return palette.error;
    case 'expiring_soon':
      return palette.warning;
    default:
      return palette.textSecondary;
  }
}
