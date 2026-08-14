import { supabase } from '@/lib/supabase';
import type { Review, ReviewStatus } from '@/types/domain';
import { mapReview } from './mappers';

const IMAGE_BUCKET = 'review-images';

export interface ReviewWithContext extends Review {
  productName: string;
  customerEmail: string;
}

async function fetchImages(reviewIds: string[]) {
  if (reviewIds.length === 0) return [];
  const { data, error } = await supabase.from('review_images').select('*').in('review_id', reviewIds).order('position');
  if (error) throw error;
  return data ?? [];
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
    const reviews = data ?? [];
    const images = await fetchImages(reviews.map((r) => r.id));
    return reviews.map((row) => mapReview(row, images));
  },

  /**
   * Whether `profileId` has a qualifying (paid+) order containing this
   * product — used only to decide whether to *show* the review form; the
   * real enforcement is the reviews_enforce_verified_purchase trigger
   * (migration 0030), which cannot be bypassed by a crafted client request.
   */
  async hasPurchased(productId: string, profileId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('orders')
      .select('id, order_items!inner(product_id)')
      .eq('profile_id', profileId)
      .eq('order_items.product_id', productId)
      .in('status', ['paid', 'processing', 'ready_for_shipping', 'shipped', 'delivered', 'refunded', 'partially_refunded'])
      .limit(1);
    if (error) throw error;
    return (data ?? []).length > 0;
  },

  async getOwnReview(productId: string, profileId: string): Promise<Review | null> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .eq('profile_id', profileId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const images = await fetchImages([data.id]);
    return mapReview(data, images);
  },

  /** order_id is deliberately not accepted here — the reviews_enforce_verified_purchase trigger derives it server-side. */
  async create(input: { productId: string; profileId: string; rating: number; title?: string; body?: string }): Promise<Review> {
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

  async uploadImage(reviewId: string, file: File): Promise<void> {
    const path = `${reviewId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { error: uploadError } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file, { cacheControl: '3600', upsert: false });
    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);

    const { count } = await supabase.from('review_images').select('id', { count: 'exact', head: true }).eq('review_id', reviewId);

    const { error } = await supabase.from('review_images').insert({ review_id: reviewId, url: publicUrl, position: count ?? 0 });
    if (error) throw error;
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

    const [{ data: products, error: productsError }, { data: profiles, error: profilesError }, images] = await Promise.all([
      supabase.from('products').select('id, name').in('id', productIds),
      supabase.from('profiles').select('id, email').in('id', profileIds),
      fetchImages(reviews.map((r) => r.id)),
    ]);
    if (productsError) throw productsError;
    if (profilesError) throw profilesError;

    const productNameById = new Map(products?.map((p) => [p.id, p.name]));
    const emailById = new Map(profiles?.map((p) => [p.id, p.email]));

    return reviews.map((row) => ({
      ...mapReview(row, images),
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
