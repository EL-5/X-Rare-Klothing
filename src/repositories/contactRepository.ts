import { supabase } from '@/lib/supabase';
import type { ContactSubmission, ContactSubmissionInput, ContactStatus } from '@/types/domain';
import type { ContactSubmissionRow } from '@/types/database';

function mapSubmission(row: ContactSubmissionRow): ContactSubmission {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    orderNumber: row.order_number,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
  };
}

export const contactRepository = {
  /** Anonymous insert (RLS: "Anyone can submit a contact message") — no `.select()`, matching newsletterRepository's pattern, since RLS RETURNING would otherwise be checked against the (staff-only) select policy. */
  async submit(input: ContactSubmissionInput): Promise<void> {
    const { error } = await supabase.from('contact_submissions').insert({
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      phone: input.phone || null,
      subject: input.subject,
      order_number: input.orderNumber || null,
      message: input.message,
    });
    if (error) throw error;
  },

  async listForAdmin(status?: ContactStatus): Promise<ContactSubmission[]> {
    let query = supabase.from('contact_submissions').select('*').order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapSubmission);
  },

  async updateStatus(id: string, status: ContactStatus): Promise<void> {
    const { error } = await supabase.from('contact_submissions').update({ status }).eq('id', id);
    if (error) throw error;
  },
};
