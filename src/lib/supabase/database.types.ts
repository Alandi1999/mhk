export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      cart_items: {
        Row: {
          product_id: string;
          quantity: number;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          product_id: string;
          quantity: number;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          product_id?: string;
          quantity?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "catalog_products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cart_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cart_items_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      coupons: {
        Row: {
          active: boolean;
          code: string;
          created_at: string;
          discount_pct: number;
          ends_at: string | null;
          id: string;
          max_uses: number | null;
          min_order_net: number;
          starts_at: string | null;
          updated_at: string;
          uses: number;
        };
        ComputedFields: never;
        Insert: {
          active?: boolean;
          code: string;
          created_at?: string;
          discount_pct: number;
          ends_at?: string | null;
          id?: string;
          max_uses?: number | null;
          min_order_net?: number;
          starts_at?: string | null;
          updated_at?: string;
          uses?: number;
        };
        Update: {
          active?: boolean;
          code?: string;
          created_at?: string;
          discount_pct?: number;
          ends_at?: string | null;
          id?: string;
          max_uses?: number | null;
          min_order_net?: number;
          starts_at?: string | null;
          updated_at?: string;
          uses?: number;
        };
        Relationships: [];
      };
      order_events: {
        Row: {
          actor: string | null;
          created_at: string;
          id: number;
          note: string | null;
          order_id: string;
          status: Database["public"]["Enums"]["order_status"];
        };
        ComputedFields: never;
        Insert: {
          actor?: string | null;
          created_at?: string;
          id?: never;
          note?: string | null;
          order_id: string;
          status: Database["public"]["Enums"]["order_status"];
        };
        Update: {
          actor?: string | null;
          created_at?: string;
          id?: never;
          note?: string | null;
          order_id?: string;
          status?: Database["public"]["Enums"]["order_status"];
        };
        Relationships: [
          {
            foreignKeyName: "order_events_actor_fkey";
            columns: ["actor"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_events_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          line_discount: number;
          line_net: number;
          name: string;
          order_id: string;
          product_id: string;
          quantity: number;
          sku: string;
          unit_price_net: number;
          vat_rate: number;
        };
        ComputedFields: never;
        Insert: {
          id?: string;
          line_discount?: number;
          line_net: number;
          name: string;
          order_id: string;
          product_id: string;
          quantity: number;
          sku: string;
          unit_price_net: number;
          vat_rate: number;
        };
        Update: {
          id?: string;
          line_discount?: number;
          line_net?: number;
          name?: string;
          order_id?: string;
          product_id?: string;
          quantity?: number;
          sku?: string;
          unit_price_net?: number;
          vat_rate?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "catalog_products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          cancel_reason: string | null;
          cancelled_at: string | null;
          coupon_code: string | null;
          coupon_pct: number | null;
          created_at: string;
          customer_cuit: string | null;
          customer_id: string;
          customer_razon_social: string;
          customer_tax_condition:
            Database["public"]["Enums"]["tax_condition"] | null;
          discount_net: number;
          id: string;
          note: string | null;
          number: number;
          status: Database["public"]["Enums"]["order_status"];
          subtotal_net: number;
          total: number;
          updated_at: string;
          vat_total: number;
        };
        ComputedFields: never;
        Insert: {
          cancel_reason?: string | null;
          cancelled_at?: string | null;
          coupon_code?: string | null;
          coupon_pct?: number | null;
          created_at?: string;
          customer_cuit?: string | null;
          customer_id: string;
          customer_razon_social: string;
          customer_tax_condition?:
            Database["public"]["Enums"]["tax_condition"] | null;
          discount_net?: number;
          id?: string;
          note?: string | null;
          number?: never;
          status?: Database["public"]["Enums"]["order_status"];
          subtotal_net: number;
          total: number;
          updated_at?: string;
          vat_total: number;
        };
        Update: {
          cancel_reason?: string | null;
          cancelled_at?: string | null;
          coupon_code?: string | null;
          coupon_pct?: number | null;
          created_at?: string;
          customer_cuit?: string | null;
          customer_id?: string;
          customer_razon_social?: string;
          customer_tax_condition?:
            Database["public"]["Enums"]["tax_condition"] | null;
          discount_net?: number;
          id?: string;
          note?: string | null;
          number?: never;
          status?: Database["public"]["Enums"]["order_status"];
          subtotal_net?: number;
          total?: number;
          updated_at?: string;
          vat_total?: number;
        };
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      price_list_items: {
        Row: {
          price: number;
          price_list_id: string;
          product_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          price: number;
          price_list_id: string;
          product_id: string;
          updated_at?: string;
        };
        Update: {
          price?: number;
          price_list_id?: string;
          product_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "price_list_items_price_list_id_fkey";
            columns: ["price_list_id"];
            isOneToOne: false;
            referencedRelation: "price_lists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "price_list_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "catalog_products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "price_list_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      price_lists: {
        Row: {
          created_at: string;
          discount_pct: number;
          id: string;
          name: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          discount_pct?: number;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          discount_pct?: number;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      product_compatibility: {
        Row: {
          id: string;
          moto_brand: string;
          moto_model: string;
          product_id: string;
          year_from: number | null;
          year_to: number | null;
        };
        ComputedFields: never;
        Insert: {
          id?: string;
          moto_brand: string;
          moto_model: string;
          product_id: string;
          year_from?: number | null;
          year_to?: number | null;
        };
        Update: {
          id?: string;
          moto_brand?: string;
          moto_model?: string;
          product_id?: string;
          year_from?: number | null;
          year_to?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_compatibility_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "catalog_products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_compatibility_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_images: {
        Row: {
          created_at: string;
          id: string;
          position: number;
          product_id: string;
          storage_path: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          position?: number;
          product_id: string;
          storage_path: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          position?: number;
          product_id?: string;
          storage_path?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "catalog_products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          active: boolean;
          base_price: number;
          brand: string | null;
          category_id: string | null;
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          sku: string;
          stock_on_hand: number;
          updated_at: string;
          vat_rate: number;
        };
        ComputedFields: never;
        Insert: {
          active?: boolean;
          base_price: number;
          brand?: string | null;
          category_id?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          sku: string;
          stock_on_hand?: number;
          updated_at?: string;
          vat_rate?: number;
        };
        Update: {
          active?: boolean;
          base_price?: number;
          brand?: string | null;
          category_id?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          sku?: string;
          stock_on_hand?: number;
          updated_at?: string;
          vat_rate?: number;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          cuit: string | null;
          id: string;
          phone: string | null;
          price_list_id: string | null;
          razon_social: string | null;
          role: Database["public"]["Enums"]["user_role"];
          status: Database["public"]["Enums"]["account_status"];
          tax_condition: Database["public"]["Enums"]["tax_condition"] | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          cuit?: string | null;
          id: string;
          phone?: string | null;
          price_list_id?: string | null;
          razon_social?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          status?: Database["public"]["Enums"]["account_status"];
          tax_condition?: Database["public"]["Enums"]["tax_condition"] | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          cuit?: string | null;
          id?: string;
          phone?: string | null;
          price_list_id?: string | null;
          razon_social?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          status?: Database["public"]["Enums"]["account_status"];
          tax_condition?: Database["public"]["Enums"]["tax_condition"] | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_price_list_id_fkey";
            columns: ["price_list_id"];
            isOneToOne: false;
            referencedRelation: "price_lists";
            referencedColumns: ["id"];
          },
        ];
      };
      promotions: {
        Row: {
          active: boolean;
          category_id: string | null;
          created_at: string;
          discount_pct: number;
          ends_at: string | null;
          id: string;
          min_qty: number;
          name: string;
          price_list_id: string | null;
          product_id: string | null;
          starts_at: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          active?: boolean;
          category_id?: string | null;
          created_at?: string;
          discount_pct: number;
          ends_at?: string | null;
          id?: string;
          min_qty?: number;
          name: string;
          price_list_id?: string | null;
          product_id?: string | null;
          starts_at?: string | null;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          category_id?: string | null;
          created_at?: string;
          discount_pct?: number;
          ends_at?: string | null;
          id?: string;
          min_qty?: number;
          name?: string;
          price_list_id?: string | null;
          product_id?: string | null;
          starts_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "promotions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "promotions_price_list_id_fkey";
            columns: ["price_list_id"];
            isOneToOne: false;
            referencedRelation: "price_lists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "promotions_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "catalog_products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "promotions_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      settings: {
        Row: {
          id: boolean;
          min_order_net: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          id?: boolean;
          min_order_net?: number;
          updated_at?: string;
        };
        Update: {
          id?: boolean;
          min_order_net?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      stock_movements: {
        Row: {
          created_at: string;
          created_by: string | null;
          delta: number;
          id: number;
          note: string | null;
          order_id: string | null;
          product_id: string;
          reason: Database["public"]["Enums"]["stock_reason"];
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          created_by?: string | null;
          delta: number;
          id?: never;
          note?: string | null;
          order_id?: string | null;
          product_id: string;
          reason: Database["public"]["Enums"]["stock_reason"];
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          delta?: number;
          id?: never;
          note?: string | null;
          order_id?: string | null;
          product_id?: string;
          reason?: Database["public"]["Enums"]["stock_reason"];
        };
        Relationships: [
          {
            foreignKeyName: "stock_movements_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_movements_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "catalog_products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      catalog_products: {
        Row: {
          brand: string | null;
          category_id: string | null;
          description: string | null;
          id: string;
          in_stock: boolean | null;
          list_price: number | null;
          name: string;
          price: number | null;
          rule_name: string | null;
          sku: string;
          vat_rate: number;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      admin_set_order_status: {
        Args: {
          p_order_id: string;
          p_status: Database["public"]["Enums"]["order_status"];
        };
        Returns: undefined;
      };
      cancel_order: {
        Args: { p_order_id: string; p_reason?: string };
        Returns: undefined;
      };
      cart_quote: { Args: { p_coupon?: string }; Returns: Json };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_approved_client: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_valid_cuit: { Args: { p_cuit: string }; Returns: boolean };
      my_price: {
        Args: { p_product_id: string; p_qty: number };
        Returns: {
          list_price: number;
          price: number;
          rule_name: string;
        }[];
      };
      place_order: {
        Args: { p_coupon?: string; p_note?: string };
        Returns: string;
      };
      price_breakdown: {
        Args: { p_product_id: string; p_qty: number; p_user_id: string };
        Returns: {
          list_price: number;
          price: number;
          rule_name: string;
        }[];
      };
      price_cart: {
        Args: { p_coupon?: string; p_user_id: string };
        Returns: Json;
      };
      product_is_visible: { Args: { p_product_id: string }; Returns: boolean };
      product_volume_tiers: {
        Args: { p_product_id: string };
        Returns: {
          min_qty: number;
          price: number;
          rule_name: string;
        }[];
      };
    };
    Enums: {
      account_status: "pending" | "approved" | "rejected";
      order_status:
        | "pending"
        | "confirmed"
        | "preparing"
        | "shipped"
        | "delivered"
        | "cancelled";
      stock_reason:
        | "initial"
        | "purchase"
        | "adjustment"
        | "sale"
        | "return"
        | "correction";
      tax_condition: "responsable_inscripto" | "monotributo" | "exento";
      user_role: "admin" | "cliente";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      account_status: ["pending", "approved", "rejected"],
      order_status: [
        "pending",
        "confirmed",
        "preparing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      stock_reason: [
        "initial",
        "purchase",
        "adjustment",
        "sale",
        "return",
        "correction",
      ],
      tax_condition: ["responsable_inscripto", "monotributo", "exento"],
      user_role: ["admin", "cliente"],
    },
  },
} as const;
