import { homepageSectionRepository, type HomepageSectionInput } from '@/repositories/homepageSectionRepository';
import type { HomepageSection } from '@/types/domain';

export interface HomepageSectionService {
  listEnabled(): Promise<HomepageSection[]>;
  listAll(): Promise<HomepageSection[]>;
  create(input: HomepageSectionInput): Promise<HomepageSection>;
  update(id: string, input: Partial<HomepageSectionInput>): Promise<HomepageSection>;
  remove(id: string): Promise<void>;
  reorder(orderedIds: string[]): Promise<void>;
}

class SupabaseHomepageSectionService implements HomepageSectionService {
  listEnabled(): Promise<HomepageSection[]> {
    return homepageSectionRepository.listEnabled();
  }

  listAll(): Promise<HomepageSection[]> {
    return homepageSectionRepository.listAll();
  }

  create(input: HomepageSectionInput): Promise<HomepageSection> {
    return homepageSectionRepository.create(input);
  }

  update(id: string, input: Partial<HomepageSectionInput>): Promise<HomepageSection> {
    return homepageSectionRepository.update(id, input);
  }

  remove(id: string): Promise<void> {
    return homepageSectionRepository.remove(id);
  }

  reorder(orderedIds: string[]): Promise<void> {
    return homepageSectionRepository.reorder(orderedIds);
  }
}

export const homepageSectionService: HomepageSectionService = new SupabaseHomepageSectionService();
