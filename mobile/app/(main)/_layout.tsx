import { Stack } from 'expo-router';
import { useApp } from '@/context/AppContext';

export default function MainLayout() {
  const { themeColors } = useApp();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: themeColors.background },
      }}
    >
      <Stack.Screen name="home" />
      <Stack.Screen name="branch-order" />
      <Stack.Screen name="order-review" />
      <Stack.Screen name="my-orders" />
      <Stack.Screen name="order-detail/[id]" />
      <Stack.Screen name="warehouse-orders" />
      <Stack.Screen name="inventory" />
      <Stack.Screen name="suppliers" />
      <Stack.Screen name="driver-deliveries" />
      <Stack.Screen name="driver-delivery/[id]" />
      <Stack.Screen name="invoices" />
      <Stack.Screen name="invoice/[id]" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="alerts" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="admin-orders" />
      <Stack.Screen name="admin-branches" />
      <Stack.Screen name="contact-warehouse" />
    </Stack>
  );
}
