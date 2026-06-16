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
} from '@/types';
import { mockUsers } from '@/data/mockUsers';
import { mockOrders, calculateOrderTotal, getLastOrderForBranch } from '@/data/mockOrders';
import { mockDeliveries } from '@/data/mockDeliveries';
import { mockInvoices } from '@/data/mockInvoices';
import { mockAlerts } from '@/data/mockAlerts';
import { mockStockItems, getStockItemById } from '@/data/mockStockItems';
import { generateOrderNumber } from '@/utils/helpers';

interface AppContextType {
  currentUser: User | null;
  login: (userId: string) => void;
  logout: () => void;
  orders: BranchOrder[];
  deliveries: Delivery[];
  invoices: Invoice[];
  alerts: Alert[];
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<BranchOrder[]>(mockOrders);
  const [deliveries, setDeliveries] = useState<Delivery[]>(mockDeliveries);
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [alerts] = useState<Alert[]>(mockAlerts);
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
    if (quantity <= 0) {
      setCart((prev) => prev.filter((c) => c.stockItemId !== stockItemId));
    } else {
      setCart((prev) =>
        prev.map((c) => (c.stockItemId === stockItemId ? { ...c, quantity } : c))
      );
    }
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
      clearCart();
      return newOrder;
    },
    [currentUser, cart, cartNotes, clearCart]
  );

  const submitOrder = useCallback(() => createOrderFromCart('submitted'), [createOrderFromCart]);
  const saveDraft = useCallback(() => createOrderFromCart('draft'), [createOrderFromCart]);

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    // TODO: Replace with API call
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o
      )
    );
  }, []);

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
    },
    []
  );

  const markInvoicePaid = useCallback((invoiceId: string) => {
    // TODO: Replace with API call
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId ? { ...inv, paymentStatus: 'paid' as const } : inv
      )
    );
  }, []);

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
  const today = '2026-06-16';

  return {
    todayOrders: orders.filter((o) => o.createdAt.startsWith(today)).length,
    pendingApproval: orders.filter((o) => o.status === 'submitted').length,
    lowStockAlerts: alerts.filter((a) => a.type === 'low_stock' || a.type === 'critical_stock').length,
    outForDelivery: orders.filter((o) => o.status === 'out_for_delivery').length,
    unpaidInvoices: invoices.filter((i) => i.paymentStatus === 'unpaid' || i.paymentStatus === 'overdue').length,
    totalOrderedThisMonth: orders
      .filter((o) => o.createdAt.startsWith('2026-06'))
      .reduce((sum, o) => sum + calculateOrderTotal(o), 0),
    preparingOrders: orders.filter((o) => o.status === 'preparing').length,
    expiringSoon: alerts.filter((a) => a.type === 'expiring_soon').length,
    paidThisMonth: invoices
      .filter((i) => i.paymentStatus === 'paid' && i.date.startsWith('2026-06'))
      .reduce((sum, i) => sum + i.grandTotal, 0),
    overdueBranches: new Set(
      invoices.filter((i) => i.paymentStatus === 'overdue').map((i) => i.branchId)
    ).size,
    totalInvoicedThisMonth: invoices
      .filter((i) => i.date.startsWith('2026-06'))
      .reduce((sum, i) => sum + i.grandTotal, 0),
  };
}

export { mockStockItems, calculateOrderTotal };
