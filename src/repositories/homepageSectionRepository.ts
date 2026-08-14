import { supabase } from '@/lib/supabase';
import type { HomepageSectionRow } from '@/types/database';
import type { HomepageSection, HomepageSectionType } from '@/types/domain';
import { mapHomepageSection } from './mappers';

export interface HomepageSectionInput {
  type: HomepageSectionType;
  title: string;
  isEnabled?: boolean;
  config: Record<string, unknown>;
}

export const homepageSectionRepository = {
  /** Public storefront read — RLS already scopes this to enabled sections for anonymous/customer callers. */
  async listEnabled(): Promise<HomepageSection[]> {
    const { data, error } = await supabase.from('homepage_sections').select('*').eq('is_enabled', true).order('position');
    if (error) throw error;
    return (data ?? []).map(mapHomepageSection);
  },

  /** Staff-only in practice — RLS grants content_manager+ visibility into disabled sections too. */
  async listAll(): Promise<HomepageSection[]> {
    const { data, error } = await supabase.from('homepage_sections').select('*').order('position');
    if (error) throw error;
    return (data ?? []).map(mapHomepageSection);
  },

  async create(input: HomepageSectionInput): Promise<HomepageSection> {
    const { count } = await supabase.from('homepage_sections').select('id', { count: 'exact', head: true });
    const { data, error } = await supabase
      .from('homepage_sections')
      .insert({
        type: input.type,
        title: input.title,
        is_enabled: input.isEnabled ?? true,
        config: input.config,
        position: count ?? 0,
      })
      .select('*')
      .single();
    if (error) throw error;
    return mapHomepageSection(data);
  },

  async update(id: string, input: Partial<HomepageSectionInput>): Promise<HomepageSection> {
    const row: Partial<HomepageSectionRow> = {};
    if (input.title !== undefined) row.title = input.title;
    if (input.isEnabled !== undefined) row.is_enabled = input.isEnabled;
    if (input.config !== undefined) row.config = input.config;

    const { data, error } = await supabase.from('homepage_sections').update(row).eq('id', id).select('*').single();
    if (error) throw error;
    return mapHomepageSection(data);
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('homepage_sections').delete().eq('id', id);
    if (error) throw error;
  },

  /** Persists a full reordering — index becomes the new position. */
  async reorder(orderedIds: string[]): Promise<void> {
    await Promise.all(orderedIds.map((id, index) => supabase.from('homepage_sections').update({ position: index }).eq('id', id)));
  },
};
