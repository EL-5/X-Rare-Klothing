import { productRepository } from '@/repositories/productRepository';
import type { Paginated, Product, SearchResult } from '@/types/domain';

export interface SearchService {
  search(query: string, page?: number, pageSize?: number): Promise<SearchResult>;
}

class SupabaseSearchService implements SearchService {
  async search(query: string, page = 1, pageSize = 24): Promise<SearchResult> {
    const trimmed = query.trim();
    if (!trimmed) {
      return { products: [], total: 0, query: trimmed, page, pageSize, hasMore: false };
    }

    const result: Paginated<Product> = await productRepository.search(trimmed, page, pageSize);
    return { products: result.items, total: result.total, query: trimmed, page, pageSize, hasMore: result.hasMore };
  }
}

export const searchService: SearchService = new SupabaseSearchService();
