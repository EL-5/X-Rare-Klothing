import { supabase } from '@/lib/supabase';

export const newsletterRepository = {
  /** Anonymous insert (RLS: "Anyone can subscribe") — a duplicate email is treated as success, not an error, since the customer's intent ("sign me up") is already satisfied. */
  async subscribe(email: string, firstName?: string): Promise<void> {
    const { error } = await supabase.from('newsletter_subscribers').insert({ email, first_name: firstName || null, source: 'footer' });
    if (error && error.code !== '23505') throw error;
  },
};
