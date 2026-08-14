import { supabase } from '@/lib/supabase';
import type { Collection } from '@/types/domain';
import type { CollectionRow, ProductStatus } from '@/types/database';
import { mapCollection } from './mappers';

export interface CollectionInput {
  slug: string;
  title: string;
  description?: string;
  image?: string;
  position?: number;
  isPublished?: boolean;
}

export interface AssignedProduct {
  productId: string;
  title: string;
  status: ProductStatus;
  position: number;
}

export const collectionRepository = {
  async getBySlug(slug: string): Promise<Collection | null> {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw error;
    return data ? mapCollection(data) : null;
  },

  /** Storefront-facing — RLS already scopes this to published collections for anonymous/customer callers. */
  async list(): Promise<Collection[]> {
    const { data, error } = await supabase.from('collections').select('*').order('position');
    if (error) throw error;
    return (data ?? []).map(mapCollection);
  },

  async create(input: CollectionInput): Promise<Collection> {
    const { data, error } = await supabase
      .from('collections')
      .insert({
        slug: input.slug,
        title: input.title,
        description: input.description || null,
        image: input.image || null,
        position: input.position ?? 0,
        is_published: input.isPublished ?? true,
      })
      .select('*')
      .single();
    if (error) throw error;
    return mapCollection(data);
  },

  async update(id: string, input: Partial<CollectionInput>): Promise<Collection> {
    const row: Partial<CollectionRow> = {};
    if (input.slug !== undefined) row.slug = input.slug;
    if (input.title !== undefined) row.title = input.title;
    if (input.description !== undefined) row.description = input.description || null;
    if (input.image !== undefined) row.image = input.image || null;
    if (input.position !== undefined) row.position = input.position;
    if (input.isPublished !== undefined) row.is_published = input.isPublished;

    const { data, error } = await supabase.from('collections').update(row).eq('id', id).select('*').single();
    if (error) throw error;
    return mapCollection(data);
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('collections').delete().eq('id', id);
    if (error) throw error;
  },

  async countProducts(collectionId: string): Promise<number> {
    const { count, error } = await supabase
      .from('collection_products')
      .select('product_id', { count: 'exact', head: true })
      .eq('collection_id', collectionId);
    if (error) throw error;
    return count ?? 0;
  },

  // ============================================================
  // Product assignment (admin)
  // ============================================================

  async listAssignedProducts(collectionId: string): Promise<AssignedProduct[]> {
    const { data: links, error } = await supabase
      .from('collection_products')
      .select('product_id, position')
      .eq('collection_id', collectionId)
      .order('position');
    if (error) throw error;
    if (!links || links.length === 0) return [];

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, status')
      .in('id', links.map((l) => l.product_id));
    if (productsError) throw productsError;

    const productById = new Map(products?.map((p) => [p.id, p]));
    return links
      .map((link) => {
        const product = productById.get(link.product_id);
        return product ? { productId: link.product_id, title: product.name, status: product.status, position: link.position } : null;
      })
      .filter((x): x is AssignedProduct => x !== null);
  },

  /** Products not yet in this collection — for the "add product" picker. */
  async listUnassignedProducts(collectionId: string, search?: string): Promise<{ id: string; title: string }[]> {
    const { data: links, error: linksError } = await supabase
      .from('collection_products')
      .select('product_id')
      .eq('collection_id', collectionId);
    if (linksError) throw linksError;
    const assignedIds = (links ?? []).map((l) => l.product_id);

    let query = supabase.from('products').select('id, name').order('name').limit(50);
    if (assignedIds.length > 0) query = query.not('id', 'in', `(${assignedIds.join(',')})`);
    if (search) {
      const safeQuery = search.replace(/[,()]/g, ' ').trim();
      if (safeQuery) query = query.ilike('name', `%${safeQuery}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((p) => ({ id: p.id, title: p.name }));
  },

  async assignProduct(collectionId: string, productId: string): Promise<void> {
    const { count } = await supabase
      .from('collection_products')
      .select('product_id', { count: 'exact', head: true })
      .eq('collection_id', collectionId);
    const { error } = await supabase
      .from('collection_products')
      .insert({ collection_id: collectionId, product_id: productId, position: count ?? 0 });
    if (error) throw error;
  },

  async unassignProduct(collectionId: string, productId: string): Promise<void> {
    const { error } = await supabase
      .from('collection_products')
      .delete()
      .eq('collection_id', collectionId)
      .eq('product_id', productId);
    if (error) throw error;
  },

  /** Persists a full reordering — pass every assigned product id in its new display order. */
  async reorderProducts(collectionId: string, orderedProductIds: string[]): Promise<void> {
    await Promise.all(
      orderedProductIds.map((productId, index) =>
        supabase
          .from('collection_products')
          .update({ position: index })
          .eq('collection_id', collectionId)
          .eq('product_id', productId),
      ),
    );
  },
};
