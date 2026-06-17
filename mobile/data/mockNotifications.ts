import { AppNotification } from '@/types';

export const mockNotifications: AppNotification[] = [
  {
    id: 'note-1',
    role: 'warehouse',
    title: 'New order needs approval',
    body: 'Tonino Verdun submitted an order for warehouse approval.',
    createdAt: '2026-06-17T08:00:00',
    read: false,
    targetRoute: '/(main)/warehouse-orders',
  },
  {
    id: 'note-2',
    role: 'admin',
    title: 'Low stock alert',
    body: 'Several core ingredients are below minimum stock.',
    createdAt: '2026-06-17T09:00:00',
    read: false,
    targetRoute: '/(main)/inventory',
  },
  {
    id: 'note-3',
    role: 'finance',
    title: 'Overdue invoice',
    body: 'One branch invoice is overdue and needs follow-up.',
    createdAt: '2026-06-16T12:00:00',
    read: false,
    targetRoute: '/(main)/invoices',
  },
];
