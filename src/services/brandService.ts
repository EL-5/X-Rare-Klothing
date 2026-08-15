import { brandRepository } from '@/repositories/brandRepository';
import type { Brand, BrandInput, BrandSummary } from '@/types/domain';

export interface BrandService {
  listPublished(): Promise<Brand[]>;
  listForAdmin(): Promise<Brand[]>;
  listSummaries(): Promise<BrandSummary[]>;
  getBySlug(slug: string): Promise<Brand | null>;
  create(input: BrandInput): Promise<Brand>;
  update(id: string, input: Partial<BrandInput>): Promise<Brand>;
  remove(id: string): Promise<void>;
}

class SupabaseBrandService implements BrandService {
  listPublished(): Promise<Brand[]> {
    return brandRepository.listPublished();
  }

  listForAdmin(): Promise<Brand[]> {
    return brandRepository.listForAdmin();
  }

  listSummaries(): Promise<BrandSummary[]> {
    return brandRepository.listSummaries();
  }

  getBySlug(slug: string): Promise<Brand | null> {
    return brandRepository.getBySlug(slug);
  }

  create(input: BrandInput): Promise<Brand> {
    return brandRepository.create(input);
  }

  update(id: string, input: Partial<BrandInput>): Promise<Brand> {
    return brandRepository.update(id, input);
  }

  remove(id: string): Promise<void> {
    return brandRepository.remove(id);
  }
}

export const brandService: BrandService = new SupabaseBrandService();
