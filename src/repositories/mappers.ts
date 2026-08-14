import type {
  AddressRow,
  CartItemRow,
  CartRow,
  CollectionRow,
  DiscountRow,
  InventoryRow,
  OrderAddressRow,
  OrderItemRow,
  OrderRow,
  PaymentRow,
  ProductRow,
  ProductVariantRow,
  ProfileRow,
  ReviewRow,
  ShippingMethodRow,
  TaxRateRow,
  WishlistItemRow,
} from '@/types/database';
import type {
  Address,
  Cart,
  CartLineItem,
  Collection,
  Customer,
  Discount,
  DiscountAppliesTo,
  InventoryLevel,
  Money,
  Order,
  OrderAddress,
  OrderLineItem,
  Payment,
  Product,
  ProductVariant,
  Review,
  ShippingRate,
  TaxRate,
  WishlistItem,
} from '@/types/domain';

export function toMoney(cents: number, currency: string): Money {
  return { cents, currency };
}

export function mapVariant(row: ProductVariantRow, currency: string, image: string | null = null): ProductVariant {
  return {
    id: row.id,
    productId: row.product_id,
    sku: row.sku,
    price: toMoney(row.price_cents, currency),
    compareAtPrice:
      row.compare_at_price_cents !== null ? toMoney(row.compare_at_price_cents, currency) : null,
    size: row.size,
    color: row.color,
    material: row.material,
    isActive: row.is_active,
    image,
  };
}

export interface ProductImageRow {
  url: string;
  variantId: string | null;
}

export function mapProduct(
  row: ProductRow,
  variantRows: ProductVariantRow[],
  images: ProductImageRow[] = [],
  currency = 'USD',
): Product {
  const imageByVariantId = new Map<string, string>();
  for (const img of images) {
    if (img.variantId && !imageByVariantId.has(img.variantId)) imageByVariantId.set(img.variantId, img.url);
  }

  const variants = variantRows.map((v) => mapVariant(v, currency, imageByVariantId.get(v.id) ?? null));
  const cheapest = variants.reduce<ProductVariant | null>(
    (min, v) => (!min || v.price.cents < min.price.cents ? v : min),
    null,
  );

  return {
    id: row.id,
    slug: row.slug,
    title: row.name,
    description: row.description,
    brand: row.brand,
    tags: row.tags,
    price: cheapest ? cheapest.price : toMoney(0, currency),
    compareAtPrice: cheapest ? cheapest.compareAtPrice : null,
    status: row.status,
    images: images.map((img) => img.url),
    variants,
  };
}

export function mapCollection(row: CollectionRow): Collection {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    image: row.image,
    isPublished: row.is_published,
  };
}

export function mapCartItem(
  row: CartItemRow,
  product: Product,
  variant: ProductVariant,
  currency: string,
): CartLineItem {
  return {
    id: row.id,
    variantId: row.variant_id,
    product: { id: product.id, slug: product.slug, title: product.title, images: product.images },
    variant: {
      id: variant.id,
      sku: variant.sku,
      price: variant.price,
      size: variant.size,
      color: variant.color,
      material: variant.material,
    },
    quantity: row.quantity,
    lineTotal: toMoney(variant.price.cents * row.quantity, currency),
  };
}

/** Discount/shipping/tax/total are placeholders here — cartService.enrich() overwrites them with server-computed values before returning a Cart to callers. */
export function mapCart(row: CartRow, items: CartLineItem[]): Cart {
  const subtotal = toMoney(
    items.reduce((sum, item) => sum + item.lineTotal.cents, 0),
    row.currency,
  );
  return {
    id: row.id,
    currency: row.currency,
    items,
    subtotal,
    discountCode: row.discount_code,
    discount: toMoney(0, row.currency),
    shippingEstimate: null,
    taxEstimate: null,
    total: subtotal,
  };
}

export function mapCustomer(row: ProfileRow): Customer {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    acceptsMarketing: row.accepts_marketing,
  };
}

export function mapAddress(row: AddressRow): Address {
  return {
    id: row.id,
    profileId: row.profile_id,
    type: row.type,
    isDefault: row.is_default,
    firstName: row.first_name,
    lastName: row.last_name,
    company: row.company,
    line1: row.address1,
    line2: row.address2,
    city: row.city,
    region: row.region,
    postalCode: row.postal_code,
    country: row.country_code,
    phone: row.phone,
  };
}

export function mapOrderAddress(row: OrderAddressRow): OrderAddress {
  return {
    type: row.type,
    firstName: row.first_name,
    lastName: row.last_name,
    company: row.company,
    line1: row.address1,
    line2: row.address2,
    city: row.city,
    region: row.region,
    postalCode: row.postal_code,
    country: row.country_code,
    phone: row.phone,
  };
}

export function mapOrderItem(row: OrderItemRow, currency: string): OrderLineItem {
  return {
    id: row.id,
    variantId: row.variant_id,
    productId: row.product_id,
    productName: row.product_name,
    variantTitle: row.variant_title,
    sku: row.sku,
    imageUrl: row.image_url,
    unitPrice: toMoney(row.unit_price_cents, currency),
    quantity: row.quantity,
    total: toMoney(row.total_cents, currency),
  };
}

export function mapOrder(
  row: OrderRow,
  items: OrderItemRow[],
  addresses: OrderAddressRow[] = [],
  payments: PaymentRow[] = [],
): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerId: row.profile_id,
    email: row.email,
    status: row.status,
    subtotal: toMoney(row.subtotal_cents, row.currency),
    discount: toMoney(row.discount_cents, row.currency),
    shipping: toMoney(row.shipping_cents, row.currency),
    tax: toMoney(row.tax_cents, row.currency),
    total: toMoney(row.total_cents, row.currency),
    items: items.map((item) => mapOrderItem(item, row.currency)),
    addresses: addresses.map(mapOrderAddress),
    payments: payments.map(mapPayment),
    customerNotes: row.customer_notes,
    internalNotes: row.internal_notes,
    placedAt: row.placed_at,
  };
}

export function mapPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    orderId: row.order_id,
    provider: row.provider,
    providerReference: row.provider_reference,
    status: row.status,
    amount: toMoney(row.amount_cents, row.currency),
    createdAt: row.created_at,
  };
}

export function mapInventoryLevel(row: InventoryRow): InventoryLevel {
  return {
    variantId: row.variant_id,
    onHand: row.on_hand,
    reserved: row.reserved,
    available: row.available,
    lowStockThreshold: row.low_stock_threshold,
  };
}

export function parseAppliesTo(raw: Record<string, unknown>): DiscountAppliesTo {
  if (Array.isArray(raw.product_ids)) return { productIds: raw.product_ids as string[] };
  if (Array.isArray(raw.collection_ids)) return { collectionIds: raw.collection_ids as string[] };
  return { all: true };
}

export function appliesToToJson(appliesTo: DiscountAppliesTo): Record<string, unknown> {
  if ('productIds' in appliesTo) return { product_ids: appliesTo.productIds };
  if ('collectionIds' in appliesTo) return { collection_ids: appliesTo.collectionIds };
  return { all: true };
}

export function mapDiscount(row: DiscountRow): Discount {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    value: row.value,
    minSubtotalCents: row.min_subtotal_cents,
    maxDiscountCents: row.max_discount_cents,
    appliesTo: parseAppliesTo(row.applies_to),
    usageLimit: row.usage_limit,
    usageCount: row.usage_count,
    perCustomerLimit: row.per_customer_limit,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
  };
}

export function mapShippingRate(row: ShippingMethodRow, currency = 'USD'): ShippingRate {
  return {
    id: row.id,
    name: row.name,
    price: toMoney(row.price_cents, currency),
    minOrder: row.min_order_cents !== null ? toMoney(row.min_order_cents, currency) : null,
  };
}

export function mapTaxRate(row: TaxRateRow): TaxRate {
  return {
    countryCode: row.country_code,
    region: row.region,
    rate: row.rate,
    isShippingTaxable: row.is_shipping_taxable,
  };
}

export function mapReview(row: ReviewRow): Review {
  return {
    id: row.id,
    productId: row.product_id,
    customerId: row.profile_id,
    orderId: row.order_id,
    rating: row.rating,
    title: row.title,
    body: row.body,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function mapWishlistItem(row: WishlistItemRow): WishlistItem {
  return {
    id: row.id,
    productId: row.product_id,
    variantId: row.variant_id,
    createdAt: row.created_at,
  };
}
