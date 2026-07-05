import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import {
  User,
  BranchOrder,
  CartItem,
  OrderStatus,
  Delivery,
  DeliveryStop,
  Invoice,
  Alert,
  Language,
  ThemeMode,
  AuditEvent,
  AppNotification,
  OfflineSyncItem,
  InventoryBalance,
  StockMovement,
  StockBatch,
  BatchAllocation,
  StockItem,
  Branch,
  Supplier,
  Warehouse,
} from '@/types';
import { generateOrderNumber, getDateKey, getMonthKey } from '@/utils/helpers';
import { calculateOrderTotal } from '@/utils/orderHelpers';
import { translate, TranslationKey } from '@/i18n/translations';
import { AppColors, darkColors, lightColors } from '@/theme/colors';
import { supabase } from '@/lib/supabase';
import { fetchLiveData, signInWithUsername } from '@/lib/liveData';

interface AppContextType {
  currentUser: User | null;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
  dataError: string | null;
  refreshData: () => Promise<{ ok: boolean; error?: string }>;
  branches: Branch[];
  suppliers: Supplier[];
  users: User[];
  warehouses: Warehouse[];
  orders: BranchOrder[];
  deliveries: Delivery[];
  invoices: Invoice[];
  alerts: Alert[];
  stockItems: StockItem[];
  inventory: InventoryBalance[];
  stockBatches: StockBatch[];
  stockMovements: StockMovement[];
  auditEvents: AuditEvent[];
  notifications: AppNotification[];
  offlineSync: OfflineSyncItem[];
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  themeMode: ThemeMode;
  themeColors: AppColors;
  toggleTheme: () => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  cart: CartItem[];
  cartNotes: string;
  setCartNotes: (notes: string) => void;
  addToCart: (stockItemId: string, quantity: number, note?: string) => void;
  updateCartItem: (stockItemId: string, quantity: number) => void;
  setCartItemNote: (stockItemId: string, note: string) => void;
  clearCart: () => void;
  loadLastOrderToCart: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
  submitOrder: () => Promise<BranchOrder | null>;
  saveDraft: () => Promise<BranchOrder | null>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<{ ok: boolean; error?: string }>;
  updateOrderLineQuantity: (orderLineId: string, quantity: number, note: string) => Promise<{ ok: boolean; error?: string }>;
  updateDeliveryStopStatus: (deliveryId: string, stopId: string, status: DeliveryStop['status']) => void;
  moveDeliveryStop: (deliveryId: string, stopId: string, direction: 'up' | 'down') => void;
  markInvoicePaid: (invoiceId: string) => void;
  addInvoicePayment: (invoiceId: string, amount: number, method?: string) => void;
  updateStockItemPrice: (stockItemId: string, price: number) => Promise<void>;
  upsertStockItem: (item: Partial<StockItem> & { id?: string; name: string; category: StockItem['category']; unit: string }) => Promise<{ ok: boolean; error?: string }>;
  adjustStockBatch: (stockBatchId: string, quantityDelta: number, note: string) => Promise<{ ok: boolean; error?: string }>;
  receiveStock: (
    items: {
      stockItemId: string;
      quantity: number;
      batchNumber: string;
      productionDate?: string;
      expiryDate?: string;
      supplierId?: string;
    }[],
    note?: string
  ) => Promise<void>;
  setPrimarySupplier: (stockItemId: string, supplierId: string) => Promise<{ ok: boolean; error?: string }>;
  upsertSupplier: (supplier: Partial<Supplier> & { id?: string; name: string }) => Promise<{ ok: boolean; error?: string }>;
  markNotificationRead: (notificationId: string) => void;
  getVisibleNotifications: () => AppNotification[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

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

function getEarliestAvailableExpiry(stockItemId: string, batches: StockBatch[]) {
  return batches
    .filter((batch) => batch.stockItemId === stockItemId && batch.currentQuantity > 0)
    .sort((a, b) => (a.expiryDate ?? '9999-12-31').localeCompare(b.expiryDate ?? '9999-12-31'))[0]?.expiryDate;
}

function syncInventoryWithBatches(
  inventory: InventoryBalance[],
  batches: StockBatch[],
  stockItemIds: string[]
) {
  const changedIds = new Set(stockItemIds);

  return inventory.map((inv) => {
    if (!changedIds.has(inv.stockItemId)) return inv;

    const currentStock = batches
      .filter((batch) => batch.stockItemId === inv.stockItemId)
      .reduce((sum, batch) => sum + batch.currentQuantity, 0);
    const expiryDate = getEarliestAvailableExpiry(inv.stockItemId, batches);

    return {
      ...inv,
      currentStock,
      expiryDate,
      status: getInventoryStatus(currentStock, inv.minimumStock, expiryDate),
    };
  });
}

function allocateFefo(
  batches: StockBatch[],
  stockItemId: string,
  requestedQuantity: number
): { nextBatches: StockBatch[]; allocations: BatchAllocation[] } {
  let remaining = requestedQuantity;
  const allocations: BatchAllocation[] = [];
  const allocatedByBatch = new Map<string, number>();
  const eligible = batches
    .filter((batch) => batch.stockItemId === stockItemId && batch.currentQuantity > 0)
    .sort((a, b) => (a.expiryDate ?? '9999-12-31').localeCompare(b.expiryDate ?? '9999-12-31'));

  for (const batch of eligible) {
    if (remaining <= 0) break;
    const quantity = Math.min(remaining, batch.currentQuantity);
    remaining -= quantity;
    allocatedByBatch.set(batch.id, quantity);
    allocations.push({
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      quantity,
      productionDate: batch.productionDate ?? '',
      expiryDate: batch.expiryDate ?? '',
    });
  }

  return {
    allocations,
    nextBatches: batches.map((batch) => {
      const allocatedQuantity = allocatedByBatch.get(batch.id);
      if (!allocatedQuantity) return batch;
      return { ...batch, currentQuantity: batch.currentQuantity - allocatedQuantity };
    }),
  };
}

function getReadableError(error: unknown, fallback = 'Could not load live data') {
  const message = error instanceof Error ? error.message : String(error || fallback);
  const normalized = message.toLowerCase();

  if (
    normalized.includes('fetch failed') ||
    normalized.includes('load failed') ||
    normalized.includes('network request failed')
  ) {
    return 'Could not reach Supabase. Check the Supabase URL in mobile/.env, internet/DNS access, and whether the Supabase project is active.';
  }

  return message;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [orders, setOrders] = useState<BranchOrder[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [alerts] = useState<Alert[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [inventory, setInventory] = useState<InventoryBalance[]>([]);
  const [stockBatches, setStockBatches] = useState<StockBatch[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [offlineSync, setOfflineSync] = useState<OfflineSyncItem[]>([]);
  const [language, setLanguage] = useState<Language>('en');
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartNotes, setCartNotes] = useState('');

  const refreshData = useCallback(async () => {
    try {
      setDataError(null);
      const liveData = await fetchLiveData();
      setCurrentUser(liveData.currentUser);
      setUsers(liveData.users);
      setBranches(liveData.branches);
      setSuppliers(liveData.suppliers);
      setWarehouses(liveData.warehouses);
      setStockItems(liveData.stockItems);
      setStockBatches(liveData.stockBatches);
      setInventory(liveData.inventory);
      setOrders(liveData.orders);
      setDeliveries(liveData.deliveries);
      setInvoices(liveData.invoices);
      return { ok: true };
    } catch (error) {
      const message = getReadableError(error);
      setDataError(message);
      return { ok: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();

    const { data } = supabase.auth.onAuthStateChange(() => {
      refreshData();
    });

    return () => data.subscription.unsubscribe();
  }, [refreshData]);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    setDataError(null);
    const { error } = await signInWithUsername(username, password);
    if (error) {
      const message = getReadableError(error, 'Login failed');
      setIsLoading(false);
      setDataError(message);
      return { ok: false, error: message };
    }
    const refreshResult = await refreshData();
    if (!refreshResult.ok) return refreshResult;
    return { ok: true };
  }, [refreshData]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setCart([]);
    setCartNotes('');
  }, []);

  const addToCart = useCallback((stockItemId: string, quantity: number, note?: string) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.stockItemId === stockItemId);
      if (existing) {
        return prev.map((c) =>
          c.stockItemId === stockItemId
            ? { ...c, quantity, note: note ?? c.note }
            : c
        );
      }
      if (quantity <= 0) return prev;
      return [...prev, { stockItemId, quantity, note }];
    });
  }, []);

  const updateCartItem = useCallback((stockItemId: string, quantity: number) => {
    setCart((prev) => {
      if (quantity <= 0) {
        return prev.filter((c) => c.stockItemId !== stockItemId);
      }

      const existing = prev.find((c) => c.stockItemId === stockItemId);
      if (!existing) {
        return [...prev, { stockItemId, quantity }];
      }

      return prev.map((c) => (c.stockItemId === stockItemId ? { ...c, quantity } : c));
    });
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => (prev === 'en' ? 'ar' : 'en'));
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const themeColors = themeMode === 'dark' ? darkColors : lightColors;

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) =>
      translate(language, key, params),
    [language]
  );

  const addAuditEvent = useCallback(
    (event: Omit<AuditEvent, 'id' | 'actorUserId' | 'createdAt'>) => {
      const now = new Date().toISOString();
      setAuditEvents((prev) => [
        {
          id: `audit-${Date.now()}`,
          actorUserId: currentUser?.id ?? 'system',
          createdAt: now,
          ...event,
        },
        ...prev,
      ]);
    },
    [currentUser]
  );

  const addNotification = useCallback((notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
    setNotifications((prev) => [
      {
        id: `note-${Date.now()}`,
        createdAt: new Date().toISOString(),
        read: false,
        ...notification,
      },
      ...prev,
    ]);
  }, []);

  const setCartItemNote = useCallback((stockItemId: string, note: string) => {
    setCart((prev) =>
      prev.map((c) => (c.stockItemId === stockItemId ? { ...c, note } : c))
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setCartNotes('');
  }, []);

  const loadLastOrderToCart = useCallback(() => {
    if (!currentUser?.branchId) return;
    const lastOrder = orders
      .filter((order) => order.branchId === currentUser.branchId && order.status !== 'draft')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    if (!lastOrder) return;
    setCart(
      lastOrder.lines.map((line) => ({
        stockItemId: line.stockItemId,
        quantity: line.quantity,
        note: line.note,
      }))
    );
    setCartNotes(lastOrder.notes ?? '');
  }, [currentUser, orders]);

  const getCartTotal = useCallback(() => {
    return cart.reduce((sum, item) => {
      const stock = stockItems.find((stockItem) => stockItem.id === item.stockItemId);
      return sum + (stock?.price ?? 0) * item.quantity;
    }, 0);
  }, [cart, stockItems]);

  const getCartItemCount = useCallback(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const createOrderFromCart = useCallback(
    async (status: OrderStatus): Promise<BranchOrder | null> => {
      if (!currentUser?.branchId || cart.length === 0) return null;

      const now = new Date().toISOString();
      const newOrder: BranchOrder = {
        id: `order-${Date.now()}`,
        orderNumber: generateOrderNumber(),
        branchId: currentUser.branchId,
        createdByUserId: currentUser.id,
        status,
        createdAt: now,
        updatedAt: now,
        lines: cart.map((item, idx) => {
          const stock = stockItems.find((stockItem) => stockItem.id === item.stockItemId)!;

          return {
            id: `line-${Date.now()}-${idx}`,
            stockItemId: item.stockItemId,
            quantity: item.quantity,
            unitPrice: stock.price,
            allocations: [],
            note: item.note,
          };
        }),
        notes: cartNotes || undefined,
      };

      const { error } = await supabase.rpc('create_order', {
        p_branch_id: currentUser.branchId,
        p_status: status,
        p_notes: cartNotes || null,
        p_lines: cart.map((item) => ({
          stock_item_id: item.stockItemId,
          quantity: item.quantity,
          note: item.note ?? null,
        })),
      });

      if (error) {
        setDataError(error.message);
        return null;
      }

      setOrders((prev) => [newOrder, ...prev]);
      addAuditEvent({
        entityType: 'order',
        entityId: newOrder.id,
        action: status === 'draft' ? 'Draft saved locally' : 'Order submitted',
        note: newOrder.orderNumber,
      });
      addNotification({
        role: status === 'draft' ? 'branch_manager' : 'warehouse',
        title: status === 'draft' ? 'Draft saved' : 'New branch order',
        body: status === 'draft' ? `${newOrder.orderNumber} is ready to sync.` : `${newOrder.orderNumber} needs warehouse review.`,
        targetRoute: status === 'draft' ? '/(main)/my-orders' : '/(main)/warehouse-orders',
      });
      if (status === 'draft') {
        setOfflineSync((prev) => [
          {
            id: `sync-${Date.now()}`,
            type: 'draft_order',
            title: `${newOrder.orderNumber} draft`,
            createdAt: new Date().toISOString(),
            status: 'queued',
          },
          ...prev,
        ]);
      }
      clearCart();
      await refreshData();
      return newOrder;
    },
    [currentUser, cart, cartNotes, stockItems, addAuditEvent, addNotification, clearCart, refreshData]
  );

  const submitOrder = useCallback(() => createOrderFromCart('submitted'), [createOrderFromCart]);
  const saveDraft = useCallback(() => createOrderFromCart('draft'), [createOrderFromCart]);

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    const order = orders.find((o) => o.id === orderId);
    setDataError(null);
    const { error } = await supabase.rpc('update_order_status', {
      p_order_id: orderId,
      p_status: status,
    });

    if (error) {
      setDataError(error.message);
      return { ok: false, error: error.message };
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o
      )
    );
    addAuditEvent({
      entityType: 'order',
      entityId: orderId,
      action: `Order status changed to ${status}`,
      note: order?.orderNumber,
    });
    addNotification({
      role: 'branch_manager',
      title: 'Order status updated',
      body: `${order?.orderNumber ?? 'Order'} is now ${status.replace(/_/g, ' ')}.`,
      targetRoute: `/(main)/order-detail/${orderId}`,
    });
    await refreshData();
    return { ok: true };
  }, [addAuditEvent, addNotification, orders, refreshData]);

  const updateOrderLineQuantity = useCallback(
    async (orderLineId: string, quantity: number, note: string) => {
      const { error } = await supabase.rpc('update_order_line_quantity', {
        p_order_line_id: orderLineId,
        p_quantity: quantity,
        p_note: note,
      });

      if (error) {
        setDataError(error.message);
        return { ok: false, error: error.message };
      }

      addAuditEvent({
        entityType: 'order',
        entityId: orderLineId,
        action: 'Order quantity edited',
        note,
      });
      await refreshData();
      return { ok: true };
    },
    [addAuditEvent, refreshData]
  );

  const updateDeliveryStopStatus = useCallback(
    async (deliveryId: string, stopId: string, status: DeliveryStop['status']) => {
      const { error } = await supabase
        .from('delivery_stops')
        .update({
          status,
          delivered_at: status === 'delivered' ? new Date().toISOString() : null,
        })
        .eq('id', stopId);

      if (error) {
        setDataError(error.message);
        return;
      }

      setDeliveries((prev) =>
        prev.map((d) =>
          d.id === deliveryId
            ? {
                ...d,
                stops: d.stops.map((s) => (s.id === stopId ? { ...s, status } : s)),
              }
            : d
        )
      );
      addAuditEvent({
        entityType: 'delivery',
        entityId: stopId,
        action: `Delivery stop marked ${status}`,
      });
    },
    [addAuditEvent]
  );

  const moveDeliveryStop = useCallback(async (deliveryId: string, stopId: string, direction: 'up' | 'down') => {
    const delivery = deliveries.find((item) => item.id === deliveryId);
    if (!delivery) return;

    const stops = [...delivery.stops].sort((a, b) => a.stopNumber - b.stopNumber);
    const currentIndex = stops.findIndex((stop) => stop.id === stopId);
    if (currentIndex < 0) return;

    const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex < 0 || nextIndex >= stops.length) return;

    [stops[currentIndex], stops[nextIndex]] = [stops[nextIndex], stops[currentIndex]];
    const renumberedStops = stops.map((stop, index) => ({
      ...stop,
      stopNumber: index + 1,
    }));

    setDeliveries((prev) =>
      prev.map((delivery) => {
        if (delivery.id !== deliveryId) return delivery;
        return { ...delivery, stops: renumberedStops };
      })
    );

    const updates = await Promise.all(
      renumberedStops.map((stop) =>
        supabase.from('delivery_stops').update({ stop_number: stop.stopNumber }).eq('id', stop.id)
      )
    );
    const error = updates.find((result) => result.error)?.error;
    if (error) {
      setDataError(error.message);
      await refreshData();
    }
  }, [deliveries, refreshData]);

  const markInvoicePaid = useCallback(async (invoiceId: string) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (!invoice) return;

    const { error } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        paid_amount: invoice.grandTotal,
      })
      .eq('id', invoiceId);

    if (error) {
      setDataError(error.message);
      return;
    }

    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId
          ? {
              ...inv,
              paymentStatus: 'paid' as const,
              paidAmount: inv.grandTotal,
              lastPaymentDate: getDateKey(),
            }
          : inv
      )
    );
    addAuditEvent({
      entityType: 'invoice',
      entityId: invoiceId,
        action: 'Invoice marked paid',
      });
  }, [addAuditEvent, invoices]);

  const addInvoicePayment = useCallback(
    async (invoiceId: string, amount: number, method = 'Cash') => {
      const invoice = invoices.find((inv) => inv.id === invoiceId);
      if (!invoice) return;

      const paidAmount = Math.min(invoice.grandTotal, (invoice.paidAmount ?? 0) + amount);
      const paymentStatus = paidAmount >= invoice.grandTotal ? 'paid' : 'partial';
      const { error: paymentError } = await supabase.from('payments').insert({
        invoice_id: invoiceId,
        amount,
        method,
        recorded_by: currentUser?.id ?? null,
      });

      if (paymentError) {
        setDataError(paymentError.message);
        return;
      }

      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({
          status: paymentStatus,
          paid_amount: paidAmount,
        })
        .eq('id', invoiceId);

      if (invoiceError) {
        setDataError(invoiceError.message);
        return;
      }

      setInvoices((prev) =>
        prev.map((inv) => {
          if (inv.id !== invoiceId) return inv;
          return {
            ...inv,
            paidAmount,
            paymentStatus,
            lastPaymentDate: getDateKey(),
          };
        })
      );
      addAuditEvent({
        entityType: 'invoice',
        entityId: invoiceId,
        action: `Payment added (${method})`,
        note: `$${amount.toFixed(2)}`,
      });
      addNotification({
        role: 'finance',
        title: 'Payment recorded',
        body: `$${amount.toFixed(2)} added to invoice.`,
        targetRoute: `/(main)/invoice/${invoiceId}`,
      });
    },
    [addAuditEvent, addNotification, currentUser, invoices]
  );

  const updateStockItemPrice = useCallback(
    async (stockItemId: string, price: number) => {
      const cleanPrice = Math.max(0, Number.isFinite(price) ? price : 0);
      const stock = stockItems.find((item) => item.id === stockItemId);
      const { error } = await supabase.rpc('update_stock_price', {
        p_stock_item_id: stockItemId,
        p_price: cleanPrice,
      });

      if (error) {
        setDataError(error.message);
        return;
      }

      setStockItems((prev) =>
        prev.map((item) => (item.id === stockItemId ? { ...item, price: cleanPrice } : item))
      );
      addAuditEvent({
        entityType: 'inventory',
        entityId: stockItemId,
        action: 'Stock item price updated',
        note: `${stock?.name ?? stockItemId}: $${cleanPrice.toFixed(2)}`,
      });
      await refreshData();
    },
    [addAuditEvent, refreshData, stockItems]
  );

  const upsertStockItem = useCallback(
    async (item: Partial<StockItem> & { id?: string; name: string; category: StockItem['category']; unit: string }) => {
      const { error } = await supabase.rpc('upsert_stock_item', {
        p_stock_item_id: item.id ?? null,
        p_name: item.name,
        p_category: item.category,
        p_unit: item.unit,
        p_price: item.price ?? 0,
        p_requires_expiry: item.requiresExpiry ?? true,
        p_average_order_qty: item.averageOrderQty ?? 1,
        p_active: true,
      });

      if (error) {
        setDataError(error.message);
        return { ok: false, error: error.message };
      }

      addAuditEvent({
        entityType: 'inventory',
        entityId: item.id ?? 'new-stock-item',
        action: item.id ? 'Stock item updated' : 'Stock item added',
        note: item.name,
      });
      await refreshData();
      return { ok: true };
    },
    [addAuditEvent, refreshData]
  );

  const adjustStockBatch = useCallback(
    async (stockBatchId: string, quantityDelta: number, note: string) => {
      const { error } = await supabase.rpc('adjust_stock_batch', {
        p_stock_batch_id: stockBatchId,
        p_quantity_delta: quantityDelta,
        p_note: note,
      });

      if (error) {
        setDataError(error.message);
        return { ok: false, error: error.message };
      }

      addAuditEvent({
        entityType: 'inventory',
        entityId: stockBatchId,
        action: 'Stock batch adjusted',
        note: `${quantityDelta > 0 ? '+' : ''}${quantityDelta} - ${note}`,
      });
      await refreshData();
      return { ok: true };
    },
    [addAuditEvent, refreshData]
  );

  const receiveStock = useCallback(
    async (
      items: {
        stockItemId: string;
        quantity: number;
        batchNumber: string;
        productionDate?: string;
        expiryDate?: string;
        supplierId?: string;
      }[],
      note = 'Supplier delivery'
    ) => {
      const now = new Date().toISOString();
      const date = getDateKey();
      const warehouseId = currentUser?.warehouseId ?? warehouses[0]?.id;
      if (!warehouseId) {
        setDataError('No warehouse is configured');
        return;
      }

      const { error } = await supabase.rpc('receive_stock', {
        p_warehouse_id: warehouseId,
        p_supplier_id: null,
        p_note: note,
        p_items: items.map((item) => ({
          stock_item_id: item.stockItemId,
          supplier_id: item.supplierId ?? null,
          quantity: item.quantity,
          batch_number: item.batchNumber,
          production_date: item.productionDate ?? null,
          expiry_date: item.expiryDate ?? null,
        })),
      });

      if (error) {
        setDataError(error.message);
        return;
      }

      const receivedBatches: StockBatch[] = items.map((item, index) => ({
        id: `batch-${Date.now()}-${index}`,
        stockItemId: item.stockItemId,
        warehouseId,
        batchNumber: item.batchNumber.trim(),
        productionDate: item.productionDate,
        expiryDate: item.expiryDate,
        receivedDate: date,
        originalQuantity: item.quantity,
        currentQuantity: item.quantity,
        supplierId: item.supplierId,
        note,
      }));
      const nextBatches = [...receivedBatches, ...stockBatches];
      const changedStockItemIds = items.map((item) => item.stockItemId);

      setStockBatches(nextBatches);
      setInventory((prev) => syncInventoryWithBatches(prev, nextBatches, changedStockItemIds));

      setStockMovements((prev) => [
        ...items.map((item, index) => ({
          id: `mov-${Date.now()}-${index}`,
          stockItemId: item.stockItemId,
          warehouseId,
          type: 'receive' as const,
          quantity: item.quantity,
          date,
          batchId: receivedBatches[index].id,
          batchNumber: item.batchNumber,
          note: item.productionDate && item.expiryDate ? `${note} - prod ${item.productionDate}, exp ${item.expiryDate}` : note,
        })),
        ...prev,
      ]);

      addAuditEvent({
        entityType: 'inventory',
        entityId: `receive-${Date.now()}`,
        action: 'Stock received',
        note: `${items.length} batches - ${note}`,
      });
      addNotification({
        role: 'admin',
        title: 'Stock received',
        body: `${items.length} stock batches were received into storage.`,
        targetRoute: '/(main)/inventory',
      });
      setOfflineSync((prev) => [
        {
          id: `sync-${Date.now()}`,
          type: 'status_update',
          title: 'Stock receipt synced',
          createdAt: now,
          status: 'synced',
        },
        ...prev,
      ]);
      await refreshData();
    },
    [addAuditEvent, addNotification, currentUser, refreshData, stockBatches, warehouses]
  );

  const setPrimarySupplier = useCallback(
    async (stockItemId: string, supplierId: string) => {
      const { error } = await supabase.rpc('set_primary_supplier', {
        p_stock_item_id: stockItemId,
        p_supplier_id: supplierId,
      });

      if (error) {
        setDataError(error.message);
        return { ok: false, error: error.message };
      }

      await refreshData();
      return { ok: true };
    },
    [refreshData]
  );

  const upsertSupplier = useCallback(
    async (supplier: Partial<Supplier> & { id?: string; name: string }) => {
      const { error } = await supabase.rpc('upsert_supplier', {
        p_supplier_id: supplier.id ?? null,
        p_name: supplier.name,
        p_contact_name: supplier.contactName ?? '',
        p_phone: supplier.phone ?? '',
        p_email: supplier.email ?? '',
        p_lead_time_days: supplier.leadTimeDays ?? 0,
        p_active: true,
      });

      if (error) {
        setDataError(error.message);
        return { ok: false, error: error.message };
      }

      addAuditEvent({
        entityType: 'inventory',
        entityId: supplier.id ?? 'new-supplier',
        action: supplier.id ? 'Supplier updated' : 'Supplier added',
        note: supplier.name,
      });
      await refreshData();
      return { ok: true };
    },
    [addAuditEvent, refreshData]
  );

  const markNotificationRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId ? { ...notification, read: true } : notification
      )
    );
  }, []);

  const getVisibleNotifications = useCallback(() => {
    if (!currentUser) return [];
    return notifications.filter(
      (notification) =>
        notification.role === 'all' ||
        notification.role === currentUser.role ||
        notification.userId === currentUser.id
    );
  }, [currentUser, notifications]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        login,
        logout,
        isLoading,
        dataError,
        refreshData,
        branches,
        suppliers,
        users,
        warehouses,
        orders,
        deliveries,
        invoices,
        alerts,
        stockItems,
        inventory,
        stockBatches,
        stockMovements,
        auditEvents,
        notifications,
        offlineSync,
        language,
        setLanguage,
        toggleLanguage,
        themeMode,
        themeColors,
        toggleTheme,
        t,
        cart,
        cartNotes,
        setCartNotes,
        addToCart,
        updateCartItem,
        setCartItemNote,
        clearCart,
        loadLastOrderToCart,
        getCartTotal,
        getCartItemCount,
        submitOrder,
        saveDraft,
        updateOrderStatus,
        updateOrderLineQuantity,
        updateDeliveryStopStatus,
        moveDeliveryStop,
        markInvoicePaid,
        addInvoicePayment,
        updateStockItemPrice,
        upsertStockItem,
        adjustStockBatch,
        receiveStock,
        setPrimarySupplier,
        upsertSupplier,
        markNotificationRead,
        getVisibleNotifications,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}

/** Dashboard stats helpers — replace with API queries later */
export function useDashboardStats() {
  const { orders, invoices, alerts } = useApp();
  const today = getDateKey();
  const month = getMonthKey();

  return {
    todayOrders: orders.filter((o) => o.createdAt.startsWith(today)).length,
    pendingApproval: orders.filter((o) => o.status === 'submitted').length,
    lowStockAlerts: alerts.filter((a) => a.type === 'low_stock' || a.type === 'critical_stock').length,
    outForDelivery: orders.filter((o) => o.status === 'out_for_delivery').length,
    unpaidInvoices: invoices.filter((i) => i.paymentStatus === 'unpaid' || i.paymentStatus === 'overdue').length,
    totalOrderedThisMonth: orders
      .filter((o) => o.createdAt.startsWith(month))
      .reduce((sum, o) => sum + calculateOrderTotal(o), 0),
    preparingOrders: orders.filter((o) => o.status === 'preparing').length,
    expiringSoon: alerts.filter((a) => a.type === 'expiring_soon').length,
    paidThisMonth: invoices
      .filter((i) => i.paymentStatus === 'paid' && i.date.startsWith(month))
      .reduce((sum, i) => sum + i.grandTotal, 0),
    overdueBranches: new Set(
      invoices.filter((i) => i.paymentStatus === 'overdue').map((i) => i.branchId)
    ).size,
    totalInvoicedThisMonth: invoices
      .filter((i) => i.date.startsWith(month))
      .reduce((sum, i) => sum + i.grandTotal, 0),
  };
}

export { calculateOrderTotal };
