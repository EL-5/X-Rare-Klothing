import { supabase } from '@/lib/supabase';
import type { Address, AddressType } from '@/types/domain';
import { mapAddress } from './mappers';

export interface AddressInput {
  type: AddressType;
  isDefault?: boolean;
  firstName: string;
  lastName: string;
  company?: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postalCode?: string;
  country: string;
  phone?: string;
}

function toRow(input: Partial<AddressInput>) {
  return {
    ...(input.type !== undefined ? { type: input.type } : {}),
    ...(input.isDefault !== undefined ? { is_default: input.isDefault } : {}),
    ...(input.firstName !== undefined ? { first_name: input.firstName } : {}),
    ...(input.lastName !== undefined ? { last_name: input.lastName } : {}),
    ...(input.company !== undefined ? { company: input.company || null } : {}),
    ...(input.line1 !== undefined ? { address1: input.line1 } : {}),
    ...(input.line2 !== undefined ? { address2: input.line2 || null } : {}),
    ...(input.city !== undefined ? { city: input.city } : {}),
    ...(input.region !== undefined ? { region: input.region || null } : {}),
    ...(input.postalCode !== undefined ? { postal_code: input.postalCode || null } : {}),
    ...(input.country !== undefined ? { country_code: input.country } : {}),
    ...(input.phone !== undefined ? { phone: input.phone || null } : {}),
  };
}

export const addressRepository = {
  async listByProfile(profileId: string): Promise<Address[]> {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('profile_id', profileId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapAddress);
  },

  async create(profileId: string, input: AddressInput): Promise<Address> {
    const { data, error } = await supabase
      .from('addresses')
      .insert({
        profile_id: profileId,
        type: input.type,
        is_default: input.isDefault ?? false,
        first_name: input.firstName,
        last_name: input.lastName,
        company: input.company || null,
        address1: input.line1,
        address2: input.line2 || null,
        city: input.city,
        region: input.region || null,
        postal_code: input.postalCode || null,
        country_code: input.country,
        phone: input.phone || null,
      })
      .select('*')
      .single();
    if (error) throw error;
    return mapAddress(data);
  },

  async update(id: string, input: Partial<AddressInput>): Promise<Address> {
    const { data, error } = await supabase
      .from('addresses')
      .update(toRow(input))
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return mapAddress(data);
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('addresses').delete().eq('id', id);
    if (error) throw error;
  },
};
