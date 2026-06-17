import { User } from '@/types';

export const mockUsers: User[] = [
  { id: 'user-1', name: 'Antonio Tonino', email: 'antonio@tonino.com', role: 'admin', phone: '+961 70 000 001' },
  { id: 'user-2', name: 'Maria Khoury', email: 'maria@tonino.com', role: 'branch_manager', branchId: 'branch-1', phone: '+961 70 111 222' },
  { id: 'user-3', name: 'Samir Fares', email: 'samir@tonino.com', role: 'branch_manager', branchId: 'branch-2', phone: '+961 70 222 333' },
  { id: 'user-4', name: 'Nadia Saad', email: 'nadia@tonino.com', role: 'branch_manager', branchId: 'branch-3', phone: '+961 70 333 444' },
  { id: 'user-5', name: 'Omar Hassan', email: 'omar@tonino.com', role: 'branch_manager', branchId: 'branch-4', phone: '+971 50 444 555' },
  { id: 'user-6', name: 'Hassan Warehouse', email: 'warehouse@tonino.com', role: 'warehouse', warehouseId: 'warehouse-1', phone: '+961 70 555 666' },
  { id: 'user-7', name: 'Karim Driver', email: 'karim@tonino.com', role: 'driver', phone: '+961 70 666 777' },
  { id: 'user-8', name: 'Layla Finance', email: 'finance@tonino.com', role: 'finance', phone: '+961 70 777 888' },
  { id: 'user-9', name: 'Rami Purchasing', email: 'purchasing@tonino.com', role: 'supplier', phone: '+961 70 888 999' },
];

export const roleLabels: Record<User['role'], string> = {
  admin: 'Admin / Owner',
  branch_manager: 'Branch Manager / Franchisee',
  warehouse: 'Warehouse / Stock Manager',
  driver: 'Driver',
  finance: 'Finance',
  supplier: 'Supplier / Purchasing',
};

export const roleEmojis: Record<User['role'], string> = {
  admin: '👑',
  branch_manager: '🏪',
  warehouse: '📦',
  driver: '🚚',
  finance: '💰',
  supplier: '🛒',
};
