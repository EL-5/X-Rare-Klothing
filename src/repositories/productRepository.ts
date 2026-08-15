import { supabase } from '@/lib/supabase';
import type { BrandSummary, Paginated, Product, ProductVariant } from '@/types/domain';
import type { ProductRow, ProductStatus, ProductVariantRow } from '@/types/database';
import { mapProduct, mapVariant, type ProductImageRow } from './mappers';

export interface ListProductsParams {
  collectionSlug?: string;
  categorySlug?: string;
  brandSlug?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'featured' | 'price_asc' | 'price_desc' | 'title_asc' | 'title_desc' | 'newest';
}

export interface AdminListProductsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: ProductStatus;
}

export interface ProductFormInput {
  slug: string;
  name: string;
  description?: string;
  sku?: string;
  status: ProductStatus;
  brandId?: string | null;
  categoryId?: string | null;
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
}

export interface VariantFormInput {
  sku: string;
  priceCents: number;
  compareAtPriceCents?: number | null;
  costCents?: number | null;
  barcode?: string | null;
  weightGrams?: number | null;
  size?: string | null;
  color?: string | null;
  material?: string | null;
  isActive: boolean;
}

function productInputToRow(input: Partial<ProductFormInput>): Partial<ProductRow> {
  const row: Partial<ProductRow> = {};
  if (input.slug !== undefined) row.slug = input.slug;
  if (input.name !== undefined) row.name = input.name;
  if (input.description !== undefined) row.description = input.description || null;
  if (input.sku !== undefined) row.sku = input.sku || null;
  if (input.status !== undefined) row.status = input.status;
  if (input.brandId !== undefined) row.brand_id = input.brandId || null;
  if (input.categoryId !== undefined) row.category_id = input.categoryId || null;
  if (input.tags !== undefined) row.tags = input.tags;
  if (input.seoTitle !== undefined) row.seo_title = input.seoTitle || null;
  if (input.seoDescription !== undefined) row.seo_description = input.seoDescription || null;
  return row;
}

function variantInputToRow(input: Partial<VariantFormInput>): Partial<ProductVariantRow> {
  const row: Partial<ProductVariantRow> = {};
  if (input.sku !== undefined) row.sku = input.sku;
  if (input.priceCents !== undefined) row.price_cents = input.priceCents;
  if (input.compareAtPriceCents !== undefined) row.compare_at_price_cents = input.compareAtPriceCents;
  if (input.costCents !== undefined) row.cost_cents = input.costCents;
  if (input.barcode !== undefined) row.barcode = input.barcode || null;
  if (input.weightGrams !== undefined) row.weight_grams = input.weightGrams;
  if (input.size !== undefined) row.size = input.size || null;
  if (input.color !== undefined) row.color = input.color || null;
  if (input.material !== undefined) row.material = input.material || null;
  if (input.isActive !== undefined) row.is_active = input.isActive;
  return row;
}

/**
 * Splits productIds into fixed-size chunks. Both variants_by_products and a
 * plain product_images select are subject to Supabase's platform-level
 * db-max-rows cap (1000 on this project) — for an unscoped catalog fetch
 * across hundreds of products with many variants/images each, a single
 * request can silently come back truncated (still a 200, just missing
 * rows) rather than erroring, which is worse than a chunk-size guess being
 * slightly conservative. 20 products per chunk keeps even the
 * highest-variant-count products (up to ~36 variants) safely under 1000
 * rows per request.
 */
function chunkIds(ids: string[], size = 20): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += size) chunks.push(ids.slice(i, i + size));
  return chunks;
}

// Reads go through the variants_by_products/variants_by_ids RPCs, not the
// base table: cost_cents/barcode (wholesale cost / internal barcode) come
// back real for staff and null for everyone else, decided inside the
// SECURITY DEFINER function itself via has_any_role() (see migration
// 0041) — RLS alone can't do this since it's row-level only, and a plain
// column-level grant can't either, since customers and staff share the
// same Postgres `authenticated` role in Supabase. Writes (create/update/
// delete) still target the base table.
async function fetchVariants(productIds: string[]): Promise<Map<string, ProductVariantRow[]>> {
  if (productIds.length === 0) return new Map();

  const chunks = await Promise.all(
    chunkIds(productIds).map(async (chunk) => {
      const { data, error } = await supabase.rpc('variants_by_products', { _product_ids: chunk });
      if (error) throw error;
      return data ?? [];
    }),
  );

  const byProduct = new Map<string, ProductVariantRow[]>();
  for (const row of chunks.flat()) {
    const existing = byProduct.get(row.product_id) ?? [];
    existing.push(row);
    byProduct.set(row.product_id, existing);
  }
  return byProduct;
}

async function fetchImages(productIds: string[]): Promise<Map<string, ProductImageRow[]>> {
  if (productIds.length === 0) return new Map();

  const chunks = await Promise.all(
    chunkIds(productIds).map(async (chunk) => {
      const { data, error } = await supabase
        .from('product_images')
        .select('product_id, variant_id, url')
        .in('product_id', chunk)
        .order('position');
      if (error) throw error;
      return data ?? [];
    }),
  );

  const byProduct = new Map<string, ProductImageRow[]>();
  for (const row of chunks.flat()) {
    const existing = byProduct.get(row.product_id) ?? [];
    existing.push({ url: row.url, variantId: row.variant_id });
    byProduct.set(row.product_id, existing);
  }
  return byProduct;
}

async function fetchBrands(brandIds: string[]): Promise<Map<string, BrandSummary>> {
  const ids = [...new Set(brandIds)];
  if (ids.length === 0) return new Map();

  const { data, error } = await supabase.from('brands').select('id, name, slug').in('id', ids);
  if (error) throw error;

  return new Map((data ?? []).map((b) => [b.id, { id: b.id, name: b.name, slug: b.slug }]));
}

async function hydrate(rows: ProductRow[]): Promise<Product[]> {
  const ids = rows.map((row) => row.id);
  const brandIds = rows.map((row) => row.brand_id).filter((id): id is string => id !== null);
  const [variantsByProduct, imagesByProduct, brandsById] = await Promise.all([
    fetchVariants(ids),
    fetchImages(ids),
    fetchBrands(brandIds),
  ]);
  return rows.map((row) =>
    mapProduct(
      row,
      variantsByProduct.get(row.id) ?? [],
      imagesByProduct.get(row.id) ?? [],
      'USD',
      row.brand_id ? (brandsById.get(row.brand_id) ?? null) : null,
    ),
  );
}

export const productRepository = {
  async getBySlug(slug: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const products = await hydrate([data]);
    return products[0] ?? null;
  },

  async list(params: ListProductsParams = {}): Promise<Paginated<Product>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 24;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from('products').select('*', { count: 'exact' }).eq('status', 'active');

    if (params.brandSlug) {
      const { data: brand, error: brandError } = await supabase.from('brands').select('id').eq('slug', params.brandSlug).maybeSingle();
      if (brandError) throw brandError;
      if (!brand) return { items: [], total: 0, page, pageSize, hasMore: false };
      query = query.eq('brand_id', brand.id);
    }

    if (params.collectionSlug) {
      const { data: collection, error: collectionError } = await supabase
        .from('collections')
        .select('id')
        .eq('slug', params.collectionSlug)
        .maybeSingle();

      if (collectionError) throw collectionError;
      if (!collection) return { items: [], total: 0, page, pageSize, hasMore: false };

      const { data: links, error: linksError } = await supabase
        .from('collection_products')
        .select('product_id')
        .eq('collection_id', collection.id);

      if (linksError) throw linksError;
      const productIds = (links ?? []).map((link) => link.product_id);
      if (productIds.length === 0) return { items: [], total: 0, page, pageSize, hasMore: false };
      query = query.in('id', productIds);
    }

    if (params.categorySlug) {
      const { data: category, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', params.categorySlug)
        .maybeSingle();

      if (categoryError) throw categoryError;
      if (!category) return { items: [], total: 0, page, pageSize, hasMore: false };

      // Products are tagged to leaf categories (e.g. "Accessories > Bags"),
      // never the parent — browsing the parent ("Accessories") needs to
      // include every child's products too, not just ones tagged directly
      // to the parent (which is always empty by design).
      const { data: children, error: childrenError } = await supabase.from('categories').select('id').eq('parent_id', category.id);
      if (childrenError) throw childrenError;
      const categoryIds = [category.id, ...(children ?? []).map((c) => c.id)];
      query = query.in('category_id', categoryIds);
    }

    switch (params.sortBy) {
      case 'price_asc':
      case 'price_desc':
        // Price lives on variants now; approximate with creation order and
        // let the UI sort the hydrated page client-side if exact price
        // ordering across pages is needed later.
        query = query.order('created_at', { ascending: params.sortBy === 'price_asc' });
        break;
      case 'title_asc':
        query = query.order('name', { ascending: true });
        break;
      case 'title_desc':
        query = query.order('name', { ascending: false });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    const { data, error, count } = await query.range(from, to);
    if (error) throw error;

    const rows = data ?? [];
    const items = await hydrate(rows);
    const total = count ?? items.length;

    return { items, total, page, pageSize, hasMore: from + items.length < total };
  },

  /**
   * Re-fetches a variant + its parent product's status straight from the
   * database — used by cartService to validate an add-to-cart request
   * server-side instead of trusting whatever variant data the client had
   * loaded (see Batch 9: "Do not trust browser-supplied prices").
   */
  async getVariantForCart(variantId: string): Promise<{ variant: ProductVariant; productStatus: ProductStatus } | null> {
    const { data, error } = await supabase.rpc('variants_by_ids', { _ids: [variantId] });
    if (error) throw error;
    const variantRow = data?.[0];
    if (!variantRow) return null;

    const { data: productRow, error: productError } = await supabase
      .from('products')
      .select('status')
      .eq('id', variantRow.product_id)
      .maybeSingle();
    if (productError) throw productError;
    if (!productRow) return null;

    return { variant: mapVariant(variantRow, 'USD'), productStatus: productRow.status };
  },

  /** Units sold per product, from the public-safe aggregate function (raw inventory_movements stays staff-only — see migration 0020). */
  async getSalesCounts(): Promise<Map<string, number>> {
    const { data, error } = await supabase.rpc('public_product_sales_counts');
    if (error) throw error;
    return new Map((data ?? []).map((row) => [row.product_id, row.units_sold]));
  },

  async search(query: string, page = 1, pageSize = 24): Promise<Paginated<Product>> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Strip characters that are syntactically meaningful to PostgREST's filter
    // grammar (`,()`) so user input can't inject extra filter clauses via `.or()`.
    const safeQuery = query.replace(/[,()]/g, ' ').trim();

    const { data, error, count } = await supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('status', 'active')
      .or(`name.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%`)
      .range(from, to);

    if (error) throw error;

    const rows = data ?? [];
    const items = await hydrate(rows);
    const total = count ?? items.length;

    return { items, total, page, pageSize, hasMore: from + items.length < total };
  },

  // ============================================================
  // Admin — sees every status, not just `active`.
  // ============================================================

  async getById(id: string): Promise<Product | null> {
    const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const products = await hydrate([data]);
    return products[0] ?? null;
  },

  async listForAdmin(params: AdminListProductsParams = {}): Promise<Paginated<Product>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from('products').select('*', { count: 'exact' }).order('created_at', { ascending: false });

    if (params.status) {
      query = query.eq('status', params.status);
    }
    if (params.search) {
      const safeQuery = params.search.replace(/[,()]/g, ' ').trim();
      if (safeQuery) query = query.or(`name.ilike.%${safeQuery}%,sku.ilike.%${safeQuery}%`);
    }

    const { data, error, count } = await query.range(from, to);
    if (error) throw error;

    const rows = data ?? [];
    const items = await hydrate(rows);
    const total = count ?? items.length;

    return { items, total, page, pageSize, hasMore: from + items.length < total };
  },

  async create(input: ProductFormInput): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert({
        slug: input.slug,
        name: input.name,
        description: input.description || null,
        sku: input.sku || null,
        status: input.status,
        brand_id: input.brandId || null,
        category_id: input.categoryId || null,
        tags: input.tags,
        seo_title: input.seoTitle || null,
        seo_description: input.seoDescription || null,
      })
      .select('*')
      .single();
    if (error) throw error;
    const products = await hydrate([data]);
    return products[0]!;
  },

  async update(id: string, input: Partial<ProductFormInput>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update(productInputToRow(input))
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    const products = await hydrate([data]);
    return products[0]!;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  },

  async createVariant(productId: string, input: VariantFormInput): Promise<ProductVariant> {
    // Returns only `id` from the write itself, then re-reads through the
    // masking view — cost_cents/barcode's column-level grant on the base
    // table is staff-and-customer-shared (`authenticated`), so an insert's
    // own RETURNING can't be trusted with those columns either; the view is
    // the one place that actually knows the caller is staff (see 0039).
    const { data: inserted, error } = await supabase
      .from('product_variants')
      .insert({
        product_id: productId,
        sku: input.sku,
        price_cents: input.priceCents,
        compare_at_price_cents: input.compareAtPriceCents ?? null,
        cost_cents: input.costCents ?? null,
        barcode: input.barcode || null,
        weight_grams: input.weightGrams ?? null,
        size: input.size || null,
        color: input.color || null,
        material: input.material || null,
        is_active: input.isActive,
      })
      .select('id')
      .single();
    if (error) throw error;
    return this.getVariantById(inserted.id);
  },

  async updateVariant(id: string, input: Partial<VariantFormInput>): Promise<ProductVariant> {
    const { error } = await supabase.from('product_variants').update(variantInputToRow(input)).eq('id', id);
    if (error) throw error;
    return this.getVariantById(id);
  },

  /** Staff-only in practice (RLS write-gated); reads via the masking RPC so the real cost_cents/barcode come back for the staff member who just wrote them. */
  async getVariantById(id: string): Promise<ProductVariant> {
    const { data, error } = await supabase.rpc('variants_by_ids', { _ids: [id] });
    if (error) throw error;
    const row = data?.[0];
    if (!row) throw new Error('Variant not found.');
    return mapVariant(row, 'USD');
  },

  async removeVariant(id: string): Promise<void> {
    const { error } = await supabase.from('product_variants').delete().eq('id', id);
    if (error) throw error;
  },

  /** Clones a product, its variants, and its image references. Always lands as `draft` regardless of the source's status, so a duplicate never goes live by accident. */
  async duplicate(id: string): Promise<Product> {
    const { data: source, error: sourceError } = await supabase.from('products').select('*').eq('id', id).single();
    if (sourceError) throw sourceError;

    const suffix = Date.now().toString(36);
    const { data: created, error: createError } = await supabase
      .from('products')
      .insert({
        slug: `${source.slug}-copy-${suffix}`,
        name: `${source.name} (Copy)`,
        description: source.description,
        sku: source.sku ? `${source.sku}-COPY-${suffix}` : null,
        status: 'draft',
        brand_id: source.brand_id,
        category_id: source.category_id,
        tags: source.tags,
        seo_title: source.seo_title,
        seo_description: source.seo_description,
      })
      .select('*')
      .single();
    if (createError) throw createError;

    const { data: variants, error: variantsError } = await supabase.rpc('variants_by_products', { _product_ids: [id] });
    if (variantsError) throw variantsError;

    if (variants && variants.length > 0) {
      const { error: insertVariantsError } = await supabase.from('product_variants').insert(
        variants.map((v) => ({
          product_id: created.id,
          sku: `${v.sku}-COPY-${suffix}`,
          barcode: null, // barcodes should stay unique to a physical item, not carry over to a duplicate
          price_cents: v.price_cents,
          compare_at_price_cents: v.compare_at_price_cents,
          cost_cents: v.cost_cents,
          size: v.size,
          color: v.color,
          material: v.material,
          weight_grams: v.weight_grams,
          is_active: v.is_active,
          position: v.position,
        })),
      );
      if (insertVariantsError) throw insertVariantsError;
    }

    const { data: images, error: imagesError } = await supabase
      .from('product_images')
      .select('url, alt_text, position')
      .eq('product_id', id);
    if (imagesError) throw imagesError;

    if (images && images.length > 0) {
      const { error: insertImagesError } = await supabase.from('product_images').insert(
        images.map((img) => ({ product_id: created.id, url: img.url, alt_text: img.alt_text, position: img.position })),
      );
      if (insertImagesError) throw insertImagesError;
    }

    const products = await hydrate([created]);
    return products[0]!;
  },

  /** Lightweight id+name list for admin pickers (e.g. discount product targeting) — avoids hydrating full Product objects. */
  async listNamesForAdmin(): Promise<{ id: string; name: string }[]> {
    const { data, error } = await supabase.from('products').select('id, name').order('name');
    if (error) throw error;
    return data ?? [];
  },
};
