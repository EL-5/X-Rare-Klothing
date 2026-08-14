import { supabase } from '@/lib/supabase';
import type { Review, ReviewStatus } from '@/types/domain';
import { mapReview } from './mappers';

export interface ReviewWithContext extends Review {
  productName: string;
  customerEmail: string;
}

export const reviewRepository = {
  /** RLS already scopes this to approved reviews for anonymous/other-customer callers — see docs/authorization.md. */
  async listByProduct(productId: string): Promise<Review[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapReview);
  },

  async create(input: {
    productId: string;
    profileId: string;
    rating: number;
    title?: string;
    body?: string;
  }): Promise<Review> {
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        product_id: input.productId,
        profile_id: input.profileId,
        rating: input.rating,
        title: input.title ?? null,
        body: input.body ?? null,
      })
      .select('*')
      .single();
    if (error) throw error;
    return mapReview(data);
  },

  /** Staff-only in practice — RLS grants content_manager+ a full-roster SELECT regardless of status. */
  async listForAdmin(status?: ReviewStatus): Promise<ReviewWithContext[]> {
    let query = supabase.from('reviews').select('*').order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);
    const { data: reviews, error } = await query;
    if (error) throw error;
    if (!reviews || reviews.length === 0) return [];

    const productIds = [...new Set(reviews.map((r) => r.product_id))];
    const profileIds = [...new Set(reviews.map((r) => r.profile_id))];

    const [{ data: products, error: productsError }, { data: profiles, error: profilesError }] = await Promise.all([
      supabase.from('products').select('id, name').in('id', productIds),
      supabase.from('profiles').select('id, email').in('id', profileIds),
    ]);
    if (productsError) throw productsError;
    if (profilesError) throw profilesError;

    const productNameById = new Map(products?.map((p) => [p.id, p.name]));
    const emailById = new Map(profiles?.map((p) => [p.id, p.email]));

    return reviews.map((row) => ({
      ...mapReview(row),
      productName: productNameById.get(row.product_id) ?? 'Unknown product',
      customerEmail: emailById.get(row.profile_id) ?? 'Unknown customer',
    }));
  },

  async updateStatus(id: string, status: ReviewStatus): Promise<Review> {
    const { data, error } = await supabase.from('reviews').update({ status }).eq('id', id).select('*').single();
    if (error) throw error;
    return mapReview(data);
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    if (error) throw error;
  },
};
