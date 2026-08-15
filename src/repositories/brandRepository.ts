import { supabase } from '@/lib/supabase';
import type { Brand, BrandInput, BrandSummary } from '@/types/domain';
import type { BrandRow } from '@/types/database';

function mapBrand(row: BrandRow, productCount = 0): Brand {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logo: row.logo,
    coverImage: row.cover_image,
    description: row.description,
    country: row.country,
    website: row.website,
    isPublished: row.is_published,
    isFeatured: row.is_featured,
    productCount,
  };
}

function brandInputToRow(input: Partial<BrandInput>): Partial<BrandRow> {
  const row: Partial<BrandRow> = {};
  if (input.name !== undefined) row.name = input.name;
  if (input.slug !== undefined) row.slug = input.slug;
  if (input.logo !== undefined) row.logo = input.logo || null;
  if (input.coverImage !== undefined) row.cover_image = input.coverImage || null;
  if (input.description !== undefined) row.description = input.description || null;
  if (input.country !== undefined) row.country = input.country || null;
  if (input.website !== undefined) row.website = input.website || null;
  if (input.isPublished !== undefined) row.is_published = input.isPublished;
  if (input.isFeatured !== undefined) row.is_featured = input.isFeatured;
  return row;
}

/** Active-product counts per brand, computed client-side from a single grouped query rather than N+1 per-brand round trips. */
async function fetchProductCounts(brandIds: string[]): Promise<Map<string, number>> {
  if (brandIds.length === 0) return new Map();
  const { data, error } = await supabase.from('products').select('brand_id').eq('status', 'active').in('brand_id', brandIds);
  if (error) throw error;
  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    if (!row.brand_id) continue;
    counts.set(row.brand_id, (counts.get(row.brand_id) ?? 0) + 1);
  }
  return counts;
}

export const brandRepository = {
  async listPublished(): Promise<Brand[]> {
    const { data, error } = await supabase.from('brands').select('*').eq('is_published', true).order('name');
    if (error) throw error;
    const rows = data ?? [];
    const counts = await fetchProductCounts(rows.map((r) => r.id));
    return rows.map((row) => mapBrand(row, counts.get(row.id) ?? 0));
  },

  async listForAdmin(): Promise<Brand[]> {
    const { data, error } = await supabase.from('brands').select('*').order('name');
    if (error) throw error;
    const rows = data ?? [];
    const counts = await fetchProductCounts(rows.map((r) => r.id));
    return rows.map((row) => mapBrand(row, counts.get(row.id) ?? 0));
  },

  async listSummaries(): Promise<BrandSummary[]> {
    const { data, error } = await supabase.from('brands').select('id, name, slug').order('name');
    if (error) throw error;
    return data ?? [];
  },

  async getBySlug(slug: string): Promise<Brand | null> {
    const { data, error } = await supabase.from('brands').select('*').eq('slug', slug).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const counts = await fetchProductCounts([data.id]);
    return mapBrand(data, counts.get(data.id) ?? 0);
  },

  async create(input: BrandInput): Promise<Brand> {
    const { data, error } = await supabase
      .from('brands')
      .insert({
        name: input.name,
        slug: input.slug,
        logo: input.logo || null,
        cover_image: input.coverImage || null,
        description: input.description || null,
        country: input.country || null,
        website: input.website || null,
        is_published: input.isPublished ?? true,
        is_featured: input.isFeatured ?? false,
      })
      .select('*')
      .single();
    if (error) throw error;
    return mapBrand(data);
  },

  async update(id: string, input: Partial<BrandInput>): Promise<Brand> {
    const { data, error } = await supabase.from('brands').update(brandInputToRow(input)).eq('id', id).select('*').single();
    if (error) throw error;
    return mapBrand(data);
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('brands').delete().eq('id', id);
    if (error) throw error;
  },
};
