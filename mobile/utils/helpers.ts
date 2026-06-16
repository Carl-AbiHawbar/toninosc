import { OrderStatus } from '@/types';
import { colors } from '@/theme/colors';

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

export function getStatusColor(status: OrderStatus): string {
  switch (status) {
    case 'draft':
      return colors.statusDraft;
    case 'submitted':
    case 'assigned_to_driver':
      return colors.statusSubmitted;
    case 'approved':
    case 'delivered':
    case 'paid':
      return colors.statusApproved;
    case 'preparing':
    case 'packed':
    case 'out_for_delivery':
      return colors.statusPreparing;
    case 'invoiced':
      return colors.info;
    case 'problem':
      return colors.statusProblem;
    default:
      return colors.textSecondary;
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

export function getInventoryStatusColor(status: string): string {
  switch (status) {
    case 'ok':
      return colors.success;
    case 'low':
      return colors.warning;
    case 'critical':
      return colors.error;
    case 'expiring_soon':
      return colors.warning;
    default:
      return colors.textSecondary;
  }
}
