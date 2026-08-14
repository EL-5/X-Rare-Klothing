import { addressRepository, type AddressInput } from '@/repositories/addressRepository';
import type { Address } from '@/types/domain';

export interface AddressService {
  listForCustomer(profileId: string): Promise<Address[]>;
  create(profileId: string, input: AddressInput): Promise<Address>;
  update(id: string, input: Partial<AddressInput>): Promise<Address>;
  remove(id: string): Promise<void>;
}

class SupabaseAddressService implements AddressService {
  listForCustomer(profileId: string): Promise<Address[]> {
    return addressRepository.listByProfile(profileId);
  }

  create(profileId: string, input: AddressInput): Promise<Address> {
    return addressRepository.create(profileId, input);
  }

  update(id: string, input: Partial<AddressInput>): Promise<Address> {
    return addressRepository.update(id, input);
  }

  remove(id: string): Promise<void> {
    return addressRepository.remove(id);
  }
}

export const addressService: AddressService = new SupabaseAddressService();
