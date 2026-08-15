import {
  collectionRepository,
  type AssignedProduct,
  type CollectionInput,
} from '@/repositories/collectionRepository';
import type { Collection } from '@/types/domain';

export interface CollectionService {
  getBySlug(slug: string): Promise<Collection | null>;
  list(): Promise<Collection[]>;
  create(input: CollectionInput): Promise<Collection>;
  update(id: string, input: Partial<CollectionInput>): Promise<Collection>;
  remove(id: string): Promise<void>;
  publish(id: string): Promise<Collection>;
  unpublish(id: string): Promise<Collection>;
  countProducts(collectionId: string): Promise<number>;
  listAssignedProducts(collectionId: string): Promise<AssignedProduct[]>;
  listUnassignedProducts(collectionId: string, search?: string): Promise<{ id: string; title: string }[]>;
  assignProduct(collectionId: string, productId: string): Promise<void>;
  unassignProduct(collectionId: string, productId: string): Promise<void>;
  reorderProducts(collectionId: string, orderedProductIds: string[]): Promise<void>;
}

class SupabaseCollectionService implements CollectionService {
  getBySlug(slug: string): Promise<Collection | null> {
    return collectionRepository.getBySlug(slug);
  }

  list(): Promise<Collection[]> {
    return collectionRepository.list();
  }

  create(input: CollectionInput): Promise<Collection> {
    return collectionRepository.create(input);
  }

  update(id: string, input: Partial<CollectionInput>): Promise<Collection> {
    return collectionRepository.update(id, input);
  }

  remove(id: string): Promise<void> {
    return collectionRepository.remove(id);
  }

  publish(id: string): Promise<Collection> {
    return collectionRepository.update(id, { isPublished: true });
  }

  unpublish(id: string): Promise<Collection> {
    return collectionRepository.update(id, { isPublished: false });
  }

  countProducts(collectionId: string): Promise<number> {
    return collectionRepository.countProducts(collectionId);
  }

  listAssignedProducts(collectionId: string): Promise<AssignedProduct[]> {
    return collectionRepository.listAssignedProducts(collectionId);
  }

  listUnassignedProducts(collectionId: string, search?: string): Promise<{ id: string; title: string }[]> {
    return collectionRepository.listUnassignedProducts(collectionId, search);
  }

  assignProduct(collectionId: string, productId: string): Promise<void> {
    return collectionRepository.assignProduct(collectionId, productId);
  }

  unassignProduct(collectionId: string, productId: string): Promise<void> {
    return collectionRepository.unassignProduct(collectionId, productId);
  }

  reorderProducts(collectionId: string, orderedProductIds: string[]): Promise<void> {
    return collectionRepository.reorderProducts(collectionId, orderedProductIds);
  }
}

export const collectionService: CollectionService = new SupabaseCollectionService();
