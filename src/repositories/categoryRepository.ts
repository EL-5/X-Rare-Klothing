import { supabase } from '@/lib/supabase';
import type { CategoryRow } from '@/types/database';

export interface Category {
  id: string;
  parentId: string | null;
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
  position: number;
}

export interface CategoryInput {
  parentId?: string | null;
  slug: string;
  name: string;
  description?: string;
  image?: string;
  position?: number;
}

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    parentId: row.parent_id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    image: row.image,
    position: row.position,
  };
}

export const categoryRepository = {
  async list(): Promise<Category[]> {
    const { data, error } = await supabase.from('categories').select('*').order('position');
    if (error) throw error;
    return (data ?? []).map(mapCategory);
  },

  async create(input: CategoryInput): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        parent_id: input.parentId || null,
        slug: input.slug,
        name: input.name,
        description: input.description || null,
        image: input.image || null,
        position: input.position ?? 0,
      })
      .select('*')
      .single();
    if (error) throw error;
    return mapCategory(data);
  },

  async update(id: string, input: Partial<CategoryInput>): Promise<Category> {
    const row: Partial<CategoryRow> = {};
    if (input.parentId !== undefined) row.parent_id = input.parentId || null;
    if (input.slug !== undefined) row.slug = input.slug;
    if (input.name !== undefined) row.name = input.name;
    if (input.description !== undefined) row.description = input.description || null;
    if (input.image !== undefined) row.image = input.image || null;
    if (input.position !== undefined) row.position = input.position;

    const { data, error } = await supabase.from('categories').update(row).eq('id', id).select('*').single();
    if (error) throw error;
    return mapCategory(data);
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
  },
};
