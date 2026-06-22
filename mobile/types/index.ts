export type Role =
  | 'admin'
  | 'branch_manager'
  | 'warehouse'
  | 'driver'
  | 'finance'
  | 'supplier';

export type Language = 'en' | 'ar';

export type ThemeMode = 'light' | 'dark';

export type OrderStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'preparing'
  | 'packed'
  | 'assigned_to_driver'
  | 'out_for_delivery'
  | 'delivered'
  | 'invoiced'
  | 'paid'
  | 'problem'
  | 'cancel_requested'
  | 'cancelled';

export type DeliveryStatus =
  | 'pending'
  | 'loaded'
  | 'on_the_way'
  | 'delivered'
  | 'problem';

export type InventoryStatus = 'ok' | 'low' | 'critical' | 'expiring_soon';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'overdue';

export type StockCategory =
  | 'Chocolate & spreads'
  | 'Fruits'
  | 'Savory ingredients'
  | 'Dough & bases'
  | 'Drinks'
  | 'Packaging'
  | 'Cleaning & disposables'
  | 'Add-ons';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  branchId?: string;
  warehouseId?: string;
  phone?: string;
}

export interface Country {
  id: string;
  name: string;
  code: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  city: string;
  countryId: string;
  phone: string;
  managerId: string;
  isFranchise: boolean;
  suppliesFree?: boolean;
}

export interface Warehouse {
  id: string;
  name: string;
  address: string;
  countryId: string;
}

export interface StockItem {
  id: string;
  name: string;
  category: StockCategory;
  unit: string;
  price: number;
  imageEmoji: string;
  averageOrderQty: number;
  supplierId?: string;
  requiresExpiry?: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  imageEmoji: string;
  description?: string;
}

export interface RecipeLine {
  id: string;
  stockItemId: string;
  quantity: number;
  unit: string;
}

export interface Recipe {
  id: string;
  menuItemId: string;
  name: string;
  lines: RecipeLine[];
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  leadTimeDays: number;
}

export interface InventoryBalance {
  id: string;
  stockItemId: string;
  warehouseId: string;
  currentStock: number;
  minimumStock: number;
  expiryDate?: string;
  status: InventoryStatus;
}

export interface StockBatch {
  id: string;
  stockItemId: string;
  warehouseId: string;
  batchNumber: string;
  productionDate?: string;
  expiryDate?: string;
  receivedDate: string;
  originalQuantity: number;
  currentQuantity: number;
  supplierId?: string;
  note?: string;
}

export interface StockMovement {
  id: string;
  stockItemId: string;
  warehouseId: string;
  type: 'receive' | 'adjust' | 'pick' | 'return';
  quantity: number;
  date: string;
  batchId?: string;
  batchNumber?: string;
  orderId?: string;
  branchId?: string;
  note?: string;
}

export interface BatchAllocation {
  batchId: string;
  batchNumber: string;
  quantity: number;
  productionDate: string;
  expiryDate: string;
}

export interface BranchOrderLine {
  id: string;
  stockItemId: string;
  quantity: number;
  unitPrice: number;
  allocations?: BatchAllocation[];
  note?: string;
}

export interface BranchOrder {
  id: string;
  orderNumber: string;
  branchId: string;
  createdByUserId: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  lines: BranchOrderLine[];
  notes?: string;
  assignedDriverId?: string;
  deliveryId?: string;
  invoiceId?: string;
}

export interface DeliveryStop {
  id: string;
  stopNumber: number;
  branchId: string;
  orderId: string;
  address: string;
  phone: string;
  boxCount: number;
  invoiceTotal: number;
  status: DeliveryStatus;
  items: { name: string; quantity: number; unit: string; batches?: BatchAllocation[] }[];
}

export interface Delivery {
  id: string;
  routeDate: string;
  driverId: string;
  status: DeliveryStatus;
  stops: DeliveryStop[];
}

export interface InvoiceLine {
  id: string;
  stockItemId: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  batches?: BatchAllocation[];
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  branchId: string;
  orderId: string;
  date: string;
  lines: InvoiceLine[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  tax: number;
  grandTotal: number;
  paymentStatus: PaymentStatus;
  paidAmount?: number;
  dueDate?: string;
  lastPaymentDate?: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  date: string;
  method: string;
  note?: string;
}

export interface AuditEvent {
  id: string;
  entityType: 'order' | 'invoice' | 'inventory' | 'delivery' | 'user';
  entityId: string;
  action: string;
  actorUserId: string;
  createdAt: string;
  note?: string;
}

export interface AppNotification {
  id: string;
  role: Role | 'all';
  userId?: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  targetRoute?: string;
}

export interface OfflineSyncItem {
  id: string;
  type: 'draft_order' | 'status_update' | 'payment_update';
  title: string;
  createdAt: string;
  status: 'queued' | 'synced';
}

export interface Alert {
  id: string;
  severity: AlertSeverity;
  type:
    | 'low_stock'
    | 'critical_stock'
    | 'expiring_soon'
    | 'unusual_order'
    | 'overdue_invoice'
    | 'supplier_delay'
    | 'delivery_problem';
  title: string;
  description: string;
  branchId?: string;
  stockItemId?: string;
  orderId?: string;
  invoiceId?: string;
  createdAt: string;
  actionLabel: string;
}

export interface CartItem {
  stockItemId: string;
  quantity: number;
  note?: string;
}
