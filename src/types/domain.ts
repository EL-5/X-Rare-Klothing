/**
 * Domain models used by services/components — deliberately decoupled from
 * the Supabase row shapes in database.ts. Repositories are responsible for
 * mapping between the two.
 */

export interface Money {
  cents: number;
  currency: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  price: Money;
  compareAtPrice: Money | null;
  size: string | null;
  color: string | null;
  material: string | null;
  isActive: boolean;
  image: string | null;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  brand: string | null;
  tags: string[];
  /** Lowest variant price — what a listing card shows before a variant is picked. */
  price: Money;
  compareAtPrice: Money | null;
  status: 'draft' | 'active' | 'archived';
  images: string[];
  variants: ProductVariant[];
}

export interface Collection {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image: string | null;
  isPublished: boolean;
}

export interface CartLineItem {
  id: string;
  variantId: string;
  product: Pick<Product, 'id' | 'slug' | 'title' | 'images'>;
  variant: Pick<ProductVariant, 'id' | 'sku' | 'price' | 'size' | 'color' | 'material'>;
  quantity: number;
  lineTotal: Money;
}

export interface Cart {
  id: string;
  currency: string;
  items: CartLineItem[];
  subtotal: Money;
  discountCode: string | null;
  /** Always freshly recomputed server-side from discountCode via validate_discount_code — never persisted/trusted as a raw amount. */
  discount: Money;
  /** null = no eligible rate yet (empty cart) or unknown. */
  shippingEstimate: Money | null;
  /** null = no known shipping address to estimate from — show "Calculated at checkout" rather than a fabricated number. */
  taxEstimate: Money | null;
  total: Money;
}

export interface Customer {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  acceptsMarketing: boolean;
}

export type AddressType = 'shipping' | 'billing';

export interface Address {
  id: string;
  profileId: string;
  type: AddressType;
  isDefault: boolean;
  firstName: string;
  lastName: string;
  company: string | null;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  postalCode: string | null;
  country: string;
  phone: string | null;
}

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

export type PaymentStatus = 'pending' | 'processing' | 'successful' | 'failed' | 'refunded' | 'partially_refunded';

export interface Payment {
  id: string;
  orderId: string;
  provider: string;
  providerReference: string | null;
  status: PaymentStatus;
  amount: Money;
  createdAt: string;
}

export interface OrderLineItem {
  id: string;
  variantId: string | null;
  productId: string | null;
  /** Snapshotted at purchase time — independent of the live catalog. */
  productName: string;
  variantTitle: string | null;
  sku: string;
  imageUrl: string | null;
  unitPrice: Money;
  quantity: number;
  total: Money;
}

export type OrderAddress = Omit<Address, 'id' | 'profileId' | 'isDefault'>;

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string | null;
  email: string;
  status: OrderStatus;
  subtotal: Money;
  discount: Money;
  shipping: Money;
  tax: Money;
  total: Money;
  items: OrderLineItem[];
  addresses: OrderAddress[];
  payments: Payment[];
  customerNotes: string | null;
  internalNotes: string | null;
  placedAt: string;
}

export type DiscountKind = 'percentage' | 'fixed_amount' | 'free_shipping';

/** Which cart/order lines a discount's amount is computed against — the whole cart, or only matching products/collections. */
export type DiscountAppliesTo = { all: true } | { productIds: string[] } | { collectionIds: string[] };

export interface Discount {
  id: string;
  name: string;
  kind: DiscountKind;
  value: number;
  minSubtotalCents: number | null;
  maxDiscountCents: number | null;
  appliesTo: DiscountAppliesTo;
  usageLimit: number | null;
  usageCount: number;
  perCustomerLimit: number | null;
  startsAt: string | null;
  endsAt: string | null;
}

export interface ShippingRate {
  id: string;
  name: string;
  price: Money;
  minOrder: Money | null;
}

export interface TaxRate {
  countryCode: string;
  region: string | null;
  rate: number;
  isShippingTaxable: boolean;
}

export interface InventoryLevel {
  variantId: string;
  onHand: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface Review {
  id: string;
  productId: string;
  customerId: string;
  /** Non-null when the review is linked to the order that purchased the product — powers a "Verified Purchase" badge. */
  orderId: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  status: ReviewStatus;
  createdAt: string;
}

export interface SearchResult {
  products: Product[];
  total: number;
  query: string;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface WishlistItem {
  id: string;
  productId: string;
  variantId: string | null;
  createdAt: string;
}

/**
 * Admin/staff role, backed by `user_roles` + enforced by RLS
 * (see docs/authorization.md). Never trust this on the client for anything
 * beyond hiding/showing UI — the database is the enforcement boundary.
 */
export type AdminRole =
  | 'super_admin'
  | 'admin'
  | 'inventory_manager'
  | 'order_manager'
  | 'content_manager'
  | 'customer_support';

/** Generic paginated result used across list-returning service methods. */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
