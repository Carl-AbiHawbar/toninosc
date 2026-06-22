export type AppRole = 'admin' | 'branch_manager' | 'warehouse' | 'driver' | 'finance' | 'supplier';
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

export type CancelStatus = 'none' | 'requested' | 'approved' | 'rejected';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string;
          role: AppRole;
          branch_id: string | null;
          active: boolean;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string; username: string; role: AppRole };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      branches: {
        Row: {
          id: string;
          name: string;
          slug: string;
          supplies_free: boolean;
          is_franchise: boolean;
        };
        Insert: Partial<Database['public']['Tables']['branches']['Row']> & { name: string; slug: string };
        Update: Partial<Database['public']['Tables']['branches']['Row']>;
      };
      stock_items: {
        Row: {
          id: string;
          name: string;
          category: string;
          unit: string;
          price: number;
          requires_expiry: boolean;
          active: boolean;
        };
        Insert: Partial<Database['public']['Tables']['stock_items']['Row']> & { name: string; category: string; unit: string };
        Update: Partial<Database['public']['Tables']['stock_items']['Row']>;
      };
    };
  };
};
