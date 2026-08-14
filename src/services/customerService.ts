import { supabase } from '@/lib/supabase';
import { customerRepository, type AdminListCustomersParams } from '@/repositories/customerRepository';
import type { Customer, Paginated } from '@/types/domain';

export interface RegisterResult {
  /** false when the project has email confirmation disabled and a session was created immediately. */
  requiresEmailConfirmation: boolean;
}

export interface CustomerService {
  getCurrent(): Promise<Customer | null>;
  getById(id: string): Promise<Customer | null>;
  register(input: {
    email: string;
    password: string;
    firstName?: string;
    acceptsMarketing?: boolean;
  }): Promise<RegisterResult>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  updatePassword(newPassword: string): Promise<void>;
  resendVerificationEmail(email: string): Promise<void>;
  update(
    id: string,
    patch: Partial<{ firstName: string; lastName: string; phone: string; acceptsMarketing: boolean }>,
  ): Promise<Customer>;
  listAllForAdmin(): Promise<Customer[]>;
  listForAdmin(params?: AdminListCustomersParams): Promise<Paginated<Customer>>;
}

class SupabaseCustomerService implements CustomerService {
  async getCurrent(): Promise<Customer | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    // The profile row is created by the `handle_new_user()` DB trigger the
    // instant the auth user exists — no client-side creation needed.
    return customerRepository.getById(user.id);
  }

  /** Staff use (e.g. the admin customer detail page) — RLS scopes this the same as any other profile read. */
  getById(id: string): Promise<Customer | null> {
    return customerRepository.getById(id);
  }

  async register(input: {
    email: string;
    password: string;
    firstName?: string;
    acceptsMarketing?: boolean;
  }): Promise<RegisterResult> {
    // first_name/accepts_marketing travel via signup metadata and are
    // written into `profiles` by the `handle_new_user()` DB trigger — see
    // supabase/migrations/0016 — so they're set correctly even when email
    // confirmation delays session creation (no client-side patch needed).
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          first_name: input.firstName ?? null,
          accepts_marketing: input.acceptsMarketing ?? false,
        },
      },
    });
    if (error) throw error;
    return { requiresEmailConfirmation: data.session === null };
  }

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async requestPasswordReset(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }

  /** Called from /reset-password, where Supabase has already exchanged the emailed link for a recovery session. */
  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }

  async resendVerificationEmail(email: string): Promise<void> {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
  }

  update(
    id: string,
    patch: Partial<{ firstName: string; lastName: string; phone: string; acceptsMarketing: boolean }>,
  ): Promise<Customer> {
    return customerRepository.update(id, patch);
  }

  listAllForAdmin(): Promise<Customer[]> {
    return customerRepository.listAll();
  }

  listForAdmin(params: AdminListCustomersParams = {}): Promise<Paginated<Customer>> {
    return customerRepository.listForAdmin(params);
  }
}

export const customerService: CustomerService = new SupabaseCustomerService();
