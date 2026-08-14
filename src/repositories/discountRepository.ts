import { supabase } from '@/lib/supabase';
import type { Discount, DiscountAppliesTo, DiscountKind } from '@/types/domain';
import type { DiscountRow } from '@/types/database';
import { appliesToToJson, mapDiscount } from './mappers';

export interface DiscountWithCode extends Discount {
  code: string;
  isActive: boolean;
}

export interface DiscountValidation {
  valid: boolean;
  discountCents: number;
  freeShipping: boolean;
  message: string | null;
}

export interface DiscountInput {
  name: string;
  code: string;
  kind: DiscountKind;
  value: number;
  minSubtotalCents?: number | null;
  maxDiscountCents?: number | null;
  appliesTo?: DiscountAppliesTo;
  usageLimit?: number | null;
  perCustomerLimit?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive?: boolean;
}

function discountInputToRow(input: Partial<DiscountInput>): Partial<DiscountRow> {
  const row: Partial<DiscountRow> = {};
  if (input.name !== undefined) row.name = input.name;
  if (input.kind !== undefined) row.kind = input.kind;
  if (input.value !== undefined) row.value = input.value;
  if (input.minSubtotalCents !== undefined) row.min_subtotal_cents = input.minSubtotalCents;
  if (input.maxDiscountCents !== undefined) row.max_discount_cents = input.maxDiscountCents;
  if (input.appliesTo !== undefined) row.applies_to = appliesToToJson(input.appliesTo);
  if (input.usageLimit !== undefined) row.usage_limit = input.usageLimit;
  if (input.perCustomerLimit !== undefined) row.per_customer_limit = input.perCustomerLimit;
  if (input.startsAt !== undefined) row.starts_at = input.startsAt;
  if (input.endsAt !== undefined) row.ends_at = input.endsAt;
  if (input.isActive !== undefined) row.is_active = input.isActive;
  return row;
}

/**
 * `discount_codes`/`discounts` are staff-read-only under RLS by design (see
 * docs/database.md) so a shopper can't enumerate live codes — everything
 * here only succeeds when called by a signed-in staff user (e.g. the admin
 * dashboard). Validating a code at checkout goes through the separate
 * `validate_discount_code` SECURITY DEFINER RPC instead.
 */
export const discountRepository = {
  /**
   * The RLS-safe path for a shopper's cart/checkout — routes through the
   * validate_discount_code security-definer function (migration 0026)
   * instead of reading `discounts`/`discount_codes` directly, which stay
   * staff-only. The function recomputes discount_cents from the cart's live
   * contents every call (respecting product/collection targeting and the
   * max-discount cap), so nothing here is ever a trusted client amount.
   */
  async validateCode(code: string, cartId: string): Promise<DiscountValidation> {
    const { data, error } = await supabase.rpc('validate_discount_code', { _code: code, _cart_id: cartId });
    if (error) throw error;
    const result = data?.[0];
    if (!result) return { valid: false, discountCents: 0, freeShipping: false, message: 'Invalid discount code.' };
    return { valid: result.valid, discountCents: result.discount_cents, freeShipping: result.free_shipping, message: result.message };
  },

  async getByCode(code: string): Promise<Discount | null> {
    const { data: codeRow, error: codeError } = await supabase
      .from('discount_codes')
      .select('discount_id')
      .ilike('code', code)
      .maybeSingle();
    if (codeError) throw codeError;
    if (!codeRow) return null;

    const { data, error } = await supabase
      .from('discounts')
      .select('*')
      .eq('id', codeRow.discount_id)
      .maybeSingle();
    if (error) throw error;
    return data ? mapDiscount(data) : null;
  },

  async listWithCodes(): Promise<DiscountWithCode[]> {
    const { data: discounts, error } = await supabase.from('discounts').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    if (!discounts || discounts.length === 0) return [];

    const { data: codes, error: codesError } = await supabase
      .from('discount_codes')
      .select('discount_id, code')
      .in('discount_id', discounts.map((d) => d.id));
    if (codesError) throw codesError;

    const codeByDiscount = new Map(codes?.map((c) => [c.discount_id, c.code]));

    return discounts.map((d) => ({ ...mapDiscount(d), code: codeByDiscount.get(d.id) ?? '', isActive: d.is_active }));
  },

  async create(input: DiscountInput): Promise<DiscountWithCode> {
    const { data: discount, error } = await supabase
      .from('discounts')
      .insert({
        name: input.name,
        kind: input.kind,
        value: input.value,
        min_subtotal_cents: input.minSubtotalCents ?? null,
        max_discount_cents: input.maxDiscountCents ?? null,
        applies_to: appliesToToJson(input.appliesTo ?? { all: true }),
        usage_limit: input.usageLimit ?? null,
        per_customer_limit: input.perCustomerLimit ?? null,
        starts_at: input.startsAt ?? null,
        ends_at: input.endsAt ?? null,
        is_active: input.isActive ?? true,
      })
      .select('*')
      .single();
    if (error) throw error;

    const { error: codeError } = await supabase.from('discount_codes').insert({ discount_id: discount.id, code: input.code });
    if (codeError) throw codeError;

    return { ...mapDiscount(discount), code: input.code, isActive: discount.is_active };
  },

  async update(id: string, input: Partial<DiscountInput>): Promise<DiscountWithCode> {
    const { data, error } = await supabase.from('discounts').update(discountInputToRow(input)).eq('id', id).select('*').single();
    if (error) throw error;

    if (input.code !== undefined) {
      const { error: codeError } = await supabase.from('discount_codes').update({ code: input.code }).eq('discount_id', id);
      if (codeError) throw codeError;
    }

    const { data: codeRow } = await supabase.from('discount_codes').select('code').eq('discount_id', id).maybeSingle();

    return { ...mapDiscount(data), code: codeRow?.code ?? input.code ?? '', isActive: data.is_active };
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('discounts').delete().eq('id', id);
    if (error) throw error;
  },
};
