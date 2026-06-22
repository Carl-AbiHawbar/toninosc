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
        invoiceTotal: 853.6,
        status: 'delivered',
        items: [
          { name: 'Nutella Spread', quantity: 5, unit: 'bucket' },
          { name: 'White Spread', quantity: 8, unit: 'bucket' },
          { name: 'Crepe Cover', quantity: 6, unit: 'pack' },
          { name: 'Hazelnuts Syrup', quantity: 10, unit: 'bottle' },
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
        invoiceTotal: 1090,
        status: 'on_the_way',
        items: [
          { name: 'Nutella Spread', quantity: 4, unit: 'bucket' },
          { name: 'Pistachio Spread', quantity: 3, unit: 'bucket' },
          { name: 'Hazelnuts Chocolate Spread', quantity: 12, unit: 'bucket' },
          { name: 'Bowls', quantity: 8, unit: 'pack / 50 pieces' },
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
        invoiceTotal: 833,
        status: 'loaded',
        items: [
          { name: 'Nutella Spread', quantity: 3, unit: 'bucket' },
          { name: 'Kinder Chocolate', quantity: 4, unit: 'box' },
          { name: 'Pistachio Syrup', quantity: 6, unit: 'bottle' },
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
