/**
 * Hand-authored to match the schema actually deployed in
 * supabase/migrations/ (Batch 2 — 37 tables, verified live against project
 * `vnzynrssckxemredycsw`). Regenerate with
 * `supabase gen types typescript --linked > src/types/database.ts` whenever
 * a new migration lands, to catch drift between this file and the real
 * schema.
 *
 * NOTE: every row/table shape below must be declared with `type`, not
 * `interface` — @supabase/supabase-js resolves its generic Database param
 * through a conditional-type check (`X extends GenericSchema ? ... : never`),
 * and TS only grants the "implicit index signature" a plain object type
 * needs to satisfy `Record<string, unknown>` to type-literal aliases, not to
 * named interfaces. An interface here silently makes every `.from(...)`
 * query resolve to `never` instead of erroring loudly, so don't reintroduce
 * `interface` in this file.
 */

// ============================================================
// Postgres enum types (supabase/migrations/0001_extensions_and_enums.sql)
// ============================================================

export type AdminRole =
  | 'super_admin'
  | 'admin'
  | 'inventory_manager'
  | 'order_manager'
  | 'content_manager'
  | 'customer_support';

export type ProductStatus = 'draft' | 'active' | 'archived';
export type AddressType = 'shipping' | 'billing';
export type InventoryMovementType =
  | 'restock'
  | 'sale'
  | 'return'
  | 'adjustment'
  | 'reservation'
  | 'release'
  | 'transfer';
export type OrderStatus =
  | 'pending'
  | 'payment_pending'
  | 'paid'
  | 'processing'
  | 'ready_for_shipping'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded';
export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'successful'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';
export type DiscountKind = 'percentage' | 'fixed_amount' | 'free_shipping';
export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'hidden';
export type ContentStatus = 'draft' | 'published' | 'archived';
export type NewsletterSubscriberStatus = 'subscribed' | 'unsubscribed';

// ============================================================
// Row shapes
// ============================================================

export type PermissionRow = { key: string; description: string };

export type RolePermissionRow = { role: AdminRole; permission_key: string };

export type UserRoleRow = {
  id: string;
  user_id: string;
  role: AdminRole;
  granted_by: string | null;
  created_at: string;
};

export type ProfileRow = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  accepts_marketing: boolean;
  created_at: string;
  updated_at: string;
};

export type AddressRow = {
  id: string;
  profile_id: string;
  type: AddressType;
  is_default: boolean;
  first_name: string;
  last_name: string;
  company: string | null;
  address1: string;
  address2: string | null;
  city: string;
  region: string | null;
  postal_code: string | null;
  country_code: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
};

export type CategoryRow = {
  id: string;
  parent_id: string | null;
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
  position: number;
  created_at: string;
  updated_at: string;
};

export type ProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sku: string | null;
  status: ProductStatus;
  brand: string | null;
  category_id: string | null;
  tags: string[];
  seo_title: string | null;
  seo_description: string | null;
  metadata: Record<string, unknown>;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductOptionRow = {
  id: string;
  product_id: string;
  name: string;
  position: number;
};

export type ProductOptionValueRow = {
  id: string;
  option_id: string;
  value: string;
  position: number;
};

export type ProductVariantRow = {
  id: string;
  product_id: string;
  sku: string;
  barcode: string | null;
  price_cents: number;
  compare_at_price_cents: number | null;
  cost_cents: number | null;
  size: string | null;
  color: string | null;
  material: string | null;
  weight_grams: number | null;
  is_active: boolean;
  position: number;
  created_at: string;
  updated_at: string;
};

export type ProductVariantOptionRow = { variant_id: string; option_value_id: string };

export type ProductImageRow = {
  id: string;
  product_id: string;
  variant_id: string | null;
  url: string;
  alt_text: string | null;
  position: number;
  created_at: string;
};

export type CollectionRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image: string | null;
  position: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type CollectionProductRow = { collection_id: string; product_id: string; position: number };

export type InventoryRow = {
  variant_id: string;
  on_hand: number;
  reserved: number;
  available: number;
  low_stock_threshold: number;
  updated_at: string;
};

export type InventoryMovementRow = {
  id: string;
  variant_id: string;
  type: InventoryMovementType;
  quantity: number;
  reason: string | null;
  reference_type: string | null;
  reference_id: string | null;
  created_by: string | null;
  created_at: string;
};

export type CartRow = {
  id: string;
  profile_id: string | null;
  session_id: string | null;
  currency: string;
  discount_code: string | null;
  created_at: string;
  updated_at: string;
};

/** JSONB shape passed to the create_order RPC (see migration 0022) — matches order_addresses' columns. */
export type CheckoutAddressInput = {
  first_name: string;
  last_name: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  region?: string;
  postal_code?: string;
  country_code: string;
  phone?: string;
};

export type CartItemRow = {
  id: string;
  cart_id: string;
  variant_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
};

export type WishlistRow = { id: string; profile_id: string; created_at: string };

export type WishlistItemRow = {
  id: string;
  wishlist_id: string;
  product_id: string;
  variant_id: string | null;
  created_at: string;
};

export type OrderRow = {
  id: string;
  order_number: string;
  profile_id: string | null;
  email: string;
  status: OrderStatus;
  currency: string;
  subtotal_cents: number;
  discount_cents: number;
  shipping_cents: number;
  tax_cents: number;
  total_cents: number;
  discount_code: string | null;
  customer_notes: string | null;
  internal_notes: string | null;
  inventory_reserved: boolean;
  placed_at: string;
  created_at: string;
  updated_at: string;
};

export type OrderItemRow = {
  id: string;
  order_id: string;
  variant_id: string | null;
  product_id: string | null;
  product_name: string;
  variant_title: string | null;
  sku: string;
  image_url: string | null;
  unit_price_cents: number;
  quantity: number;
  total_cents: number;
  created_at: string;
};

export type OrderAddressRow = {
  id: string;
  order_id: string;
  type: AddressType;
  first_name: string;
  last_name: string;
  company: string | null;
  address1: string;
  address2: string | null;
  city: string;
  region: string | null;
  postal_code: string | null;
  country_code: string;
  phone: string | null;
};

export type PaymentRow = {
  id: string;
  order_id: string;
  provider: string;
  provider_reference: string | null;
  status: PaymentStatus;
  amount_cents: number;
  currency: string;
  created_at: string;
  updated_at: string;
};

export type PaymentTransactionRow = {
  id: string;
  payment_id: string;
  type: 'authorization' | 'capture' | 'refund' | 'void';
  amount_cents: number;
  status: string;
  provider_reference: string | null;
  raw_response: Record<string, unknown>;
  created_at: string;
};

export type DiscountRow = {
  id: string;
  name: string;
  kind: DiscountKind;
  value: number;
  min_subtotal_cents: number | null;
  max_discount_cents: number | null;
  usage_limit: number | null;
  usage_count: number;
  per_customer_limit: number | null;
  applies_to: Record<string, unknown>;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type DiscountRedemptionRow = {
  id: string;
  discount_id: string;
  discount_code_id: string;
  order_id: string;
  profile_id: string | null;
  email: string;
  discount_cents: number;
  created_at: string;
};

export type DiscountCodeRow = {
  id: string;
  discount_id: string;
  code: string;
  usage_limit: number | null;
  usage_count: number;
  created_at: string;
};

export type ReviewRow = {
  id: string;
  product_id: string;
  profile_id: string;
  order_id: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  status: ReviewStatus;
  created_at: string;
  updated_at: string;
};

export type ReviewImageRow = {
  id: string;
  review_id: string;
  url: string;
  position: number;
  created_at: string;
};

export type ShippingZoneRow = {
  id: string;
  name: string;
  country_codes: string[];
  cities: string[] | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type ShippingMethodRow = {
  id: string;
  zone_id: string;
  name: string;
  price_cents: number;
  min_order_cents: number | null;
  min_delivery_days: number | null;
  max_delivery_days: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type TaxRateRow = {
  id: string;
  country_code: string;
  region: string | null;
  rate: number;
  is_shipping_taxable: boolean;
  created_at: string;
};

export type NewsletterSubscriberRow = {
  id: string;
  email: string;
  first_name: string | null;
  status: NewsletterSubscriberStatus;
  source: string | null;
  subscribed_at: string;
  unsubscribed_at: string | null;
};

export type PageRow = {
  id: string;
  slug: string;
  title: string;
  body: string | null;
  status: ContentStatus;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BlogPostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string | null;
  cover_image: string | null;
  author_id: string | null;
  status: ContentStatus;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SettingRow = {
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
  updated_by: string | null;
};

export type AuditLogRow = {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

// ============================================================
// Database — Tables map consumed by @supabase/supabase-js generics
// ============================================================

type Table<Row extends Record<string, unknown>, RequiredInsertKeys extends keyof Row> = {
  Row: Row;
  Insert: Partial<Row> & Pick<Row, RequiredInsertKeys>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      permissions: Table<PermissionRow, 'key' | 'description'>;
      role_permissions: Table<RolePermissionRow, 'role' | 'permission_key'>;
      user_roles: Table<UserRoleRow, 'user_id' | 'role'>;
      profiles: Table<ProfileRow, 'id' | 'email'>;
      addresses: Table<
        AddressRow,
        'profile_id' | 'first_name' | 'last_name' | 'address1' | 'city' | 'country_code'
      >;
      categories: Table<CategoryRow, 'slug' | 'name'>;
      products: Table<ProductRow, 'slug' | 'name'>;
      product_options: Table<ProductOptionRow, 'product_id' | 'name'>;
      product_option_values: Table<ProductOptionValueRow, 'option_id' | 'value'>;
      product_variants: Table<ProductVariantRow, 'product_id' | 'sku' | 'price_cents'>;
      product_variant_options: Table<ProductVariantOptionRow, 'variant_id' | 'option_value_id'>;
      product_images: Table<ProductImageRow, 'product_id' | 'url'>;
      collections: Table<CollectionRow, 'slug' | 'title'>;
      collection_products: Table<CollectionProductRow, 'collection_id' | 'product_id'>;
      inventory: Table<InventoryRow, 'variant_id'>;
      inventory_movements: Table<InventoryMovementRow, 'variant_id' | 'type' | 'quantity'>;
      carts: Table<CartRow, never>;
      cart_items: Table<CartItemRow, 'cart_id' | 'variant_id' | 'quantity'>;
      wishlists: Table<WishlistRow, 'profile_id'>;
      wishlist_items: Table<WishlistItemRow, 'wishlist_id' | 'product_id'>;
      orders: Table<OrderRow, 'email' | 'subtotal_cents' | 'total_cents'>;
      order_items: Table<
        OrderItemRow,
        'order_id' | 'product_name' | 'sku' | 'unit_price_cents' | 'quantity' | 'total_cents'
      >;
      order_addresses: Table<
        OrderAddressRow,
        'order_id' | 'type' | 'first_name' | 'last_name' | 'address1' | 'city' | 'country_code'
      >;
      payments: Table<PaymentRow, 'order_id' | 'provider' | 'amount_cents'>;
      payment_transactions: Table<
        PaymentTransactionRow,
        'payment_id' | 'type' | 'amount_cents' | 'status'
      >;
      discounts: Table<DiscountRow, 'name' | 'kind'>;
      discount_codes: Table<DiscountCodeRow, 'discount_id' | 'code'>;
      discount_redemptions: Table<
        DiscountRedemptionRow,
        'discount_id' | 'discount_code_id' | 'order_id' | 'email' | 'discount_cents'
      >;
      reviews: Table<ReviewRow, 'product_id' | 'profile_id' | 'rating'>;
      review_images: Table<ReviewImageRow, 'review_id' | 'url'>;
      shipping_zones: Table<ShippingZoneRow, 'name'>;
      shipping_methods: Table<ShippingMethodRow, 'zone_id' | 'name' | 'price_cents'>;
      tax_rates: Table<TaxRateRow, 'country_code' | 'rate'>;
      newsletter_subscribers: Table<NewsletterSubscriberRow, 'email'>;
      pages: Table<PageRow, 'slug' | 'title'>;
      blog_posts: Table<BlogPostRow, 'slug' | 'title'>;
      settings: Table<SettingRow, 'key'>;
      audit_logs: Table<AuditLogRow, 'action' | 'entity_type'>;
    };
    Views: Record<string, never>;
    Functions: {
      has_role: { Args: { _role: AdminRole }; Returns: boolean };
      has_any_role: { Args: { _roles: AdminRole[] }; Returns: boolean };
      is_staff: { Args: Record<string, never>; Returns: boolean };
      has_permission: { Args: { _permission_key: string }; Returns: boolean };
      public_product_sales_counts: {
        Args: Record<string, never>;
        Returns: { product_id: string; units_sold: number }[];
      };
      validate_discount_code: {
        Args: { _code: string; _cart_id: string };
        Returns: {
          valid: boolean;
          discount_cents: number;
          free_shipping: boolean;
          message: string | null;
          discount_id: string | null;
          discount_code_id: string | null;
        }[];
      };
      resolve_shipping_zone: {
        Args: { _country_code: string; _city: string | null };
        Returns: string | null;
      };
      create_order: {
        Args: {
          _cart_id: string;
          _email: string;
          _shipping_address: CheckoutAddressInput;
          _shipping_method_id: string;
          _customer_notes: string | null;
        };
        Returns: { order_id: string; order_number: string; total_cents: number; discount_cents: number; currency: string };
      };
      process_payment: {
        Args: { _order_id: string; _card_number: string };
        Returns: { status: 'successful' | 'failed'; orderStatus: string; message: string | null };
      };
      cancel_order: {
        Args: { _order_id: string; _reason: string | null };
        Returns: void;
      };
      refund_order: {
        Args: { _order_id: string; _amount_cents: number; _restock: boolean; _reason: string | null };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
