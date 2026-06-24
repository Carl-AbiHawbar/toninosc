import { supabase } from '@/lib/supabase';
import {
  BatchAllocation,
  Branch,
  BranchOrder,
  InventoryBalance,
  StockBatch,
  StockItem,
  StockItemSupplier,
  Supplier,
  User,
  Warehouse,
} from '@/types';
import { getDateKey } from '@/utils/helpers';

type ProfileRow = {
  id: string;
  username: string;
  auth_email: string;
  full_name: string;
  role: User['role'];
  branch_id: string | null;
};

type BranchRow = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  is_franchise: boolean;
  supplies_free: boolean;
};

type SupplierRow = {
  id: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  lead_time_days: number;
};

type SupplierItemRow = {
  id: string;
  supplier_id: string;
  stock_item_id: string;
  supplier_unit: string | null;
  last_price: number | string | null;
  is_primary: boolean;
  active: boolean;
  suppliers?: {
    name: string;
  } | null;
};

type WarehouseRow = {
  id: string;
  name: string;
  address: string | null;
};

type StockItemRow = {
  id: string;
  name: string;
  category: StockItem['category'];
  unit: string;
  price: number | string;
  requires_expiry: boolean;
  average_order_qty: number | string;
  supplier_id: string | null;
};

type StockBatchRow = {
  id: string;
  stock_item_id: string;
  warehouse_id: string;
  batch_number: string;
  production_date: string | null;
  expiry_date: string | null;
  received_date: string;
  original_quantity: number | string;
  current_quantity: number | string;
  supplier_id: string | null;
  note: string | null;
};

type OrderRow = {
  id: string;
  order_number: string;
  branch_id: string;
  created_by_user_id: string;
  status: BranchOrder['status'];
  notes: string | null;
  created_at: string;
  updated_at: string;
  order_lines?: OrderLineRow[];
};

type OrderLineRow = {
  id: string;
  stock_item_id: string;
  requested_quantity: number | string;
  approved_quantity: number | string | null;
  unit_price: number | string;
  branch_note: string | null;
  edit_note: string | null;
  order_line_allocations?: AllocationRow[];
};

type AllocationRow = {
  id: string;
  quantity: number | string;
  stock_batches?: StockBatchRow | null;
};

export type LiveData = {
  currentUser: User | null;
  branches: Branch[];
  suppliers: Supplier[];
  warehouses: Warehouse[];
  stockItems: StockItem[];
  stockBatches: StockBatch[];
  inventory: InventoryBalance[];
  orders: BranchOrder[];
};

const numberValue = (value: number | string | null | undefined) => Number(value ?? 0);

function stockEmoji(category: string) {
  if (category === 'Packaging') return 'P';
  if (category === 'Dough & bases') return 'D';
  if (category === 'Savory ingredients') return 'V';
  if (category === 'Cleaning & disposables') return 'R';
  if (category === 'Add-ons') return 'A';
  return 'S';
}

function getInventoryStatus(currentStock: number, minimumStock: number, expiryDate?: string) {
  if (currentStock <= 0 || currentStock <= minimumStock / 2) return 'critical' as const;
  if (currentStock <= minimumStock) return 'low' as const;

  if (expiryDate) {
    const expiry = new Date(`${expiryDate}T00:00:00`).getTime();
    const today = new Date(`${getDateKey()}T00:00:00`).getTime();
    const daysUntilExpiry = (expiry - today) / (1000 * 60 * 60 * 24);
    if (daysUntilExpiry <= 30) return 'expiring_soon' as const;
  }

  return 'ok' as const;
}

function mapProfile(row: ProfileRow | null, warehouses: Warehouse[]): User | null {
  if (!row) return null;

  return {
    id: row.id,
    name: row.full_name,
    email: row.auth_email,
    role: row.role,
    branchId: row.branch_id ?? undefined,
    warehouseId: row.role === 'warehouse' ? warehouses[0]?.id : undefined,
  };
}

function mapBranch(row: BranchRow): Branch {
  return {
    id: row.id,
    name: row.name,
    address: row.address ?? '',
    city: row.city ?? '',
    countryId: 'country-1',
    phone: row.phone ?? '',
    managerId: '',
    isFranchise: row.is_franchise,
    suppliesFree: row.supplies_free,
  };
}

function mapSupplier(row: SupplierRow, suppliedItemIds: string[] = []): Supplier {
  return {
    id: row.id,
    name: row.name,
    contactName: row.contact_name ?? '',
    phone: row.phone ?? '',
    email: row.email ?? '',
    leadTimeDays: row.lead_time_days,
    suppliedItemIds,
  };
}

function mapWarehouse(row: WarehouseRow): Warehouse {
  return {
    id: row.id,
    name: row.name,
    address: row.address ?? '',
    countryId: 'country-1',
  };
}

function mapSupplierItem(row: SupplierItemRow): StockItemSupplier {
  return {
    id: row.id,
    supplierId: row.supplier_id,
    supplierName: row.suppliers?.name ?? 'Supplier',
    supplierUnit: row.supplier_unit ?? undefined,
    lastPrice: row.last_price == null ? undefined : numberValue(row.last_price),
    isPrimary: row.is_primary,
    active: row.active,
  };
}

function mapStockItem(row: StockItemRow, suppliers: StockItemSupplier[] = []): StockItem {
  const primarySupplier = suppliers.find((supplier) => supplier.isPrimary && supplier.active);

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    unit: row.unit,
    price: numberValue(row.price),
    imageEmoji: stockEmoji(row.category),
    averageOrderQty: numberValue(row.average_order_qty),
    supplierId: primarySupplier?.supplierId ?? row.supplier_id ?? undefined,
    suppliers,
    requiresExpiry: row.requires_expiry,
  };
}

function mapStockBatch(row: StockBatchRow): StockBatch {
  return {
    id: row.id,
    stockItemId: row.stock_item_id,
    warehouseId: row.warehouse_id,
    batchNumber: row.batch_number,
    productionDate: row.production_date ?? undefined,
    expiryDate: row.expiry_date ?? undefined,
    receivedDate: row.received_date,
    originalQuantity: numberValue(row.original_quantity),
    currentQuantity: numberValue(row.current_quantity),
    supplierId: row.supplier_id ?? undefined,
    note: row.note ?? undefined,
  };
}

function buildInventory(stockItems: StockItem[], stockBatches: StockBatch[], warehouseId?: string): InventoryBalance[] {
  return stockItems.map((item) => {
    const itemBatches = stockBatches.filter(
      (batch) => batch.stockItemId === item.id && (!warehouseId || batch.warehouseId === warehouseId)
    );
    const currentStock = itemBatches.reduce((sum, batch) => sum + batch.currentQuantity, 0);
    const expiryDate = itemBatches
      .filter((batch) => batch.currentQuantity > 0 && batch.expiryDate)
      .sort((a, b) => (a.expiryDate ?? '').localeCompare(b.expiryDate ?? ''))[0]?.expiryDate;
    const minimumStock = Math.max(5, item.averageOrderQty * 2);

    return {
      id: `inventory-${item.id}`,
      stockItemId: item.id,
      warehouseId: warehouseId ?? stockBatches[0]?.warehouseId ?? 'warehouse-1',
      currentStock,
      minimumStock,
      expiryDate,
      status: getInventoryStatus(currentStock, minimumStock, expiryDate),
    };
  });
}

function mapOrder(row: OrderRow): BranchOrder {
  return {
    id: row.id,
    orderNumber: row.order_number,
    branchId: row.branch_id,
    createdByUserId: row.created_by_user_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    notes: row.notes ?? undefined,
    lines: (row.order_lines ?? []).map((line) => ({
      id: line.id,
      stockItemId: line.stock_item_id,
      quantity: numberValue(line.approved_quantity ?? line.requested_quantity),
      unitPrice: numberValue(line.unit_price),
      note: line.edit_note ?? line.branch_note ?? undefined,
      allocations: (line.order_line_allocations ?? []).map((allocation): BatchAllocation => ({
        batchId: allocation.stock_batches?.id ?? '',
        batchNumber: allocation.stock_batches?.batch_number ?? '',
        quantity: numberValue(allocation.quantity),
        productionDate: allocation.stock_batches?.production_date ?? '',
        expiryDate: allocation.stock_batches?.expiry_date ?? '',
      })),
    })),
  };
}

async function requireData<T>(request: PromiseLike<{ data: T | null; error: unknown }>, label: string): Promise<T> {
  const { data, error } = await request;
  if (error) throw new Error(`${label} failed`);
  return data as T;
}

export async function fetchLiveData(): Promise<LiveData> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;

  const [branches, suppliers, supplierItems, warehouses, stockItems, stockBatches, orders, profile] = await Promise.all([
    requireData(supabase.from('branches').select('*').eq('active', true).order('name'), 'Branches load'),
    requireData(supabase.from('suppliers').select('*').eq('active', true).order('name'), 'Suppliers load'),
    requireData(
      supabase
        .from('supplier_items')
        .select('*, suppliers(name)')
        .eq('active', true)
        .order('is_primary', { ascending: false }),
      'Supplier item sources load'
    ),
    requireData(supabase.from('warehouses').select('*').eq('active', true).order('name'), 'Warehouses load'),
    requireData(supabase.from('stock_items').select('*').eq('active', true).order('name'), 'Stock items load'),
    requireData(supabase.from('stock_batches').select('*').order('expiry_date', { nullsFirst: false }), 'Stock batches load'),
    requireData(
      supabase
        .from('orders')
        .select('*, order_lines(*, order_line_allocations(*, stock_batches(*)))')
        .order('created_at', { ascending: false }),
      'Orders load'
    ),
    userId
      ? requireData(supabase.from('profiles').select('*').eq('id', userId).maybeSingle(), 'Profile load')
      : Promise.resolve(null),
  ]);

  const mappedWarehouses = (warehouses as WarehouseRow[]).map(mapWarehouse);
  const supplierItemsByStockItem = new Map<string, StockItemSupplier[]>();
  const supplierItemIdsBySupplier = new Map<string, string[]>();

  (supplierItems as SupplierItemRow[]).forEach((row) => {
    const mapped = mapSupplierItem(row);
    supplierItemsByStockItem.set(row.stock_item_id, [
      ...(supplierItemsByStockItem.get(row.stock_item_id) ?? []),
      mapped,
    ]);
    supplierItemIdsBySupplier.set(row.supplier_id, [
      ...(supplierItemIdsBySupplier.get(row.supplier_id) ?? []),
      row.stock_item_id,
    ]);
  });

  const mappedStockItems = (stockItems as StockItemRow[]).map((item) =>
    mapStockItem(item, supplierItemsByStockItem.get(item.id) ?? [])
  );
  const mappedBatches = (stockBatches as StockBatchRow[]).map(mapStockBatch);

  return {
    currentUser: mapProfile(profile as ProfileRow | null, mappedWarehouses),
    branches: (branches as BranchRow[]).map(mapBranch),
    suppliers: (suppliers as SupplierRow[]).map((supplier) =>
      mapSupplier(supplier, supplierItemIdsBySupplier.get(supplier.id) ?? [])
    ),
    warehouses: mappedWarehouses,
    stockItems: mappedStockItems,
    stockBatches: mappedBatches,
    inventory: buildInventory(mappedStockItems, mappedBatches, mappedWarehouses[0]?.id),
    orders: (orders as OrderRow[]).map(mapOrder),
  };
}

export async function signInWithUsername(username: string, password: string) {
  return supabase.auth.signInWithPassword({
    email: `${username.trim().toLowerCase().replace(/\s+/g, '-')}@toninocrepes.com`,
    password,
  });
}
