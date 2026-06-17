import { Delivery } from '@/types';
import { getDateKey } from '@/utils/helpers';

export const mockDeliveries: Delivery[] = [
  {
    id: 'delivery-1',
    routeDate: '2026-06-11',
    driverId: 'user-7',
    status: 'delivered',
    stops: [
      {
        id: 'stop-1',
        stopNumber: 1,
        branchId: 'branch-1',
        orderId: 'order-1',
        address: 'Verdun Street, Beirut',
        phone: '+961 1 234 567',
        boxCount: 4,
        invoiceTotal: 462,
        status: 'delivered',
        items: [
          { name: 'Nutella Bucket', quantity: 5, unit: 'bucket' },
          { name: 'Lotus Spread', quantity: 8, unit: 'jar' },
          { name: 'Crepe Dough Mix', quantity: 6, unit: 'bag' },
          { name: 'Crepe Boxes', quantity: 10, unit: 'pack' },
        ],
      },
    ],
  },
  {
    id: 'delivery-2',
    routeDate: getDateKey(),
    driverId: 'user-7',
    status: 'on_the_way',
    stops: [
      {
        id: 'stop-2',
        stopNumber: 1,
        branchId: 'branch-2',
        orderId: 'order-2',
        address: 'ABC Mall, Ashrafieh',
        phone: '+961 1 345 678',
        boxCount: 3,
        invoiceTotal: 318,
        status: 'on_the_way',
        items: [
          { name: 'Nutella Bucket', quantity: 4, unit: 'bucket' },
          { name: 'Pistachio Cream', quantity: 3, unit: 'jar' },
          { name: 'Banana', quantity: 12, unit: 'kg' },
          { name: 'Soft Drinks', quantity: 8, unit: 'case' },
        ],
      },
      {
        id: 'stop-3',
        stopNumber: 2,
        branchId: 'branch-3',
        orderId: 'order-4',
        address: 'Hamra Main Street',
        phone: '+961 1 456 789',
        boxCount: 2,
        invoiceTotal: 221,
        status: 'loaded',
        items: [
          { name: 'Nutella Bucket', quantity: 3, unit: 'bucket' },
          { name: 'Cheese', quantity: 4, unit: 'kg' },
          { name: 'Napkins', quantity: 6, unit: 'pack' },
        ],
      },
    ],
  },
];

export function getTodayDeliveryForDriver(driverId: string): Delivery | undefined {
  const today = getDateKey();
  return mockDeliveries.find(
    (d) => d.driverId === driverId && d.routeDate === today
  );
}
