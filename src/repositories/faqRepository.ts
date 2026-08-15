import { supabase } from '@/lib/supabase';
import type { Faq, FaqInput, FaqCategory } from '@/types/domain';
import type { FaqRow } from '@/types/database';

function mapFaq(row: FaqRow): Faq {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    category: row.category,
    slug: row.slug,
    sortOrder: row.sort_order,
    isPublished: row.is_published,
  };
}

export const faqRepository = {
  async listPublished(): Promise<Faq[]> {
    const { data, error } = await supabase.from('faqs').select('*').eq('is_published', true).order('category').order('sort_order');
    if (error) throw error;
    return (data ?? []).map(mapFaq);
  },

  async listForAdmin(): Promise<Faq[]> {
    const { data, error } = await supabase.from('faqs').select('*').order('category').order('sort_order');
    if (error) throw error;
    return (data ?? []).map(mapFaq);
  },

  async create(input: FaqInput): Promise<Faq> {
    const { data, error } = await supabase
      .from('faqs')
      .insert({
        question: input.question,
        answer: input.answer,
        category: input.category,
        slug: input.slug,
        sort_order: input.sortOrder ?? 0,
        is_published: input.isPublished ?? true,
      })
      .select('*')
      .single();
    if (error) throw error;
    return mapFaq(data);
  },

  async update(id: string, input: Partial<FaqInput>): Promise<Faq> {
    const { data, error } = await supabase
      .from('faqs')
      .update({
        ...(input.question !== undefined ? { question: input.question } : {}),
        ...(input.answer !== undefined ? { answer: input.answer } : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.slug !== undefined ? { slug: input.slug } : {}),
        ...(input.sortOrder !== undefined ? { sort_order: input.sortOrder } : {}),
        ...(input.isPublished !== undefined ? { is_published: input.isPublished } : {}),
      })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return mapFaq(data);
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('faqs').delete().eq('id', id);
    if (error) throw error;
  },

  async reorder(category: FaqCategory, orderedIds: string[]): Promise<void> {
    await Promise.all(orderedIds.map((id, index) => supabase.from('faqs').update({ sort_order: index }).eq('id', id).eq('category', category)));
  },
};
