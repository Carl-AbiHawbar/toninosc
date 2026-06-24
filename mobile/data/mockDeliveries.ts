import { Delivery } from '@/types';
import { getDateKey } from '@/utils/helpers';

export const mockDeliveries: Delivery[] = [];

export function getTodayDeliveryForDriver(driverId: string): Delivery | undefined {
  const today = getDateKey();
  return mockDeliveries.find((delivery) => delivery.driverId === driverId && delivery.routeDate === today);
}
