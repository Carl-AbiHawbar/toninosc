import { AuditEvent } from '@/types';

export const mockAuditEvents: AuditEvent[] = [
  {
    id: 'audit-1',
    entityType: 'order',
    entityId: 'order-1',
    action: 'Order submitted',
    actorUserId: 'user-2',
    createdAt: '2026-06-10T09:00:00',
    note: 'Regular weekly order created by branch manager.',
  },
  {
    id: 'audit-2',
    entityType: 'order',
    entityId: 'order-1',
    action: 'Order approved',
    actorUserId: 'user-1',
    createdAt: '2026-06-10T11:20:00',
  },
  {
    id: 'audit-3',
    entityType: 'order',
    entityId: 'order-1',
    action: 'Packed by warehouse',
    actorUserId: 'user-6',
    createdAt: '2026-06-11T09:10:00',
  },
  {
    id: 'audit-4',
    entityType: 'order',
    entityId: 'order-1',
    action: 'Delivered',
    actorUserId: 'user-7',
    createdAt: '2026-06-11T14:00:00',
  },
  {
    id: 'audit-5',
    entityType: 'invoice',
    entityId: 'invoice-1',
    action: 'Invoice created',
    actorUserId: 'user-8',
    createdAt: '2026-06-11T16:30:00',
  },
];
