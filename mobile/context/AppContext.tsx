import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
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
} from '@/types';
import { mockUsers } from '@/data/mockUsers';
import { mockOrders, calculateOrderTotal, getLastOrderForBranch } from '@/data/mockOrders';
import { mockDeliveries } from '@/data/mockDeliveries';
import { mockInvoices } from '@/data/mockInvoices';
import { mockAlerts } from '@/data/mockAlerts';
import { mockAuditEvents } from '@/data/mockAuditEvents';
import { mockNotifications } from '@/data/mockNotifications';
import { mockOfflineSync } from '@/data/mockOfflineSync';
import { mockStockItems, getStockItemById } from '@/data/mockStockItems';
import { generateOrderNumber, getDateKey, getMonthKey } from '@/utils/helpers';
import { translate, TranslationKey } from '@/i18n/translations';
import { AppColors, darkColors, lightColors } from '@/theme/colors';

interface AppContextType {
  currentUser: User | null;
  login: (userId: string) => void;
  logout: () => void;
  orders: BranchOrder[];
  deliveries: Delivery[];
  invoices: Invoice[];
  alerts: Alert[];
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
  submitOrder: () => BranchOrder | null;
  saveDraft: () => BranchOrder | null;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateDeliveryStopStatus: (deliveryId: string, stopId: string, status: DeliveryStop['status']) => void;
  markInvoicePaid: (invoiceId: string) => void;
  addInvoicePayment: (invoiceId: string, amount: number, method?: string) => void;
  markNotificationRead: (notificationId: string) => void;
  getVisibleNotifications: () => AppNotification[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<BranchOrder[]>(mockOrders);
  const [deliveries, setDeliveries] = useState<Delivery[]>(mockDeliveries);
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [alerts] = useState<Alert[]>(mockAlerts);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(mockAuditEvents);
  const [notifications, setNotifications] = useState<AppNotification[]>(mockNotifications);
  const [offlineSync, setOfflineSync] = useState<OfflineSyncItem[]>(mockOfflineSync);
  const [language, setLanguage] = useState<Language>('en');
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartNotes, setCartNotes] = useState('');

  const login = useCallback((userId: string) => {
    const user = mockUsers.find((u) => u.id === userId);
    if (user) setCurrentUser(user);
  }, []);

  const logout = useCallback(() => {
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
    const lastOrder = getLastOrderForBranch(currentUser.branchId);
    if (!lastOrder) return;
    setCart(
      lastOrder.lines.map((line) => ({
        stockItemId: line.stockItemId,
        quantity: line.quantity,
        note: line.note,
      }))
    );
    setCartNotes(lastOrder.notes ?? '');
  }, [currentUser]);

  const getCartTotal = useCallback(() => {
    return cart.reduce((sum, item) => {
      const stock = getStockItemById(item.stockItemId);
      return sum + (stock?.price ?? 0) * item.quantity;
    }, 0);
  }, [cart]);

  const getCartItemCount = useCallback(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const createOrderFromCart = useCallback(
    (status: OrderStatus): BranchOrder | null => {
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
          const stock = getStockItemById(item.stockItemId)!;
          return {
            id: `line-${Date.now()}-${idx}`,
            stockItemId: item.stockItemId,
            quantity: item.quantity,
            unitPrice: stock.price,
            note: item.note,
          };
        }),
        notes: cartNotes || undefined,
      };

      // TODO: Replace with API call to backend (Supabase/Firebase/PostgreSQL)
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
      return newOrder;
    },
    [currentUser, cart, cartNotes, addAuditEvent, addNotification, clearCart]
  );

  const submitOrder = useCallback(() => createOrderFromCart('submitted'), [createOrderFromCart]);
  const saveDraft = useCallback(() => createOrderFromCart('draft'), [createOrderFromCart]);

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    // TODO: Replace with API call
    const order = orders.find((o) => o.id === orderId);
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
  }, [addAuditEvent, addNotification, orders]);

  const updateDeliveryStopStatus = useCallback(
    (deliveryId: string, stopId: string, status: DeliveryStop['status']) => {
      // TODO: Replace with API call
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

  const markInvoicePaid = useCallback((invoiceId: string) => {
    // TODO: Replace with API call
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
  }, [addAuditEvent]);

  const addInvoicePayment = useCallback(
    (invoiceId: string, amount: number, method = 'Cash') => {
      setInvoices((prev) =>
        prev.map((inv) => {
          if (inv.id !== invoiceId) return inv;
          const paidAmount = Math.min(inv.grandTotal, (inv.paidAmount ?? 0) + amount);
          return {
            ...inv,
            paidAmount,
            paymentStatus: paidAmount >= inv.grandTotal ? 'paid' : 'partial',
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
    [addAuditEvent, addNotification]
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
        orders,
        deliveries,
        invoices,
        alerts,
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
        updateDeliveryStopStatus,
        markInvoicePaid,
        addInvoicePayment,
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

export { mockStockItems, calculateOrderTotal };
