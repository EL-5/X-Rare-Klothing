import { categoryRepository, type Category, type CategoryInput } from '@/repositories/categoryRepository';

export interface CategoryService {
  list(): Promise<Category[]>;
  create(input: CategoryInput): Promise<Category>;
  update(id: string, input: Partial<CategoryInput>): Promise<Category>;
  remove(id: string): Promise<void>;
}

class SupabaseCategoryService implements CategoryService {
  list(): Promise<Category[]> {
    return categoryRepository.list();
  }

  create(input: CategoryInput): Promise<Category> {
    return categoryRepository.create(input);
  }

  update(id: string, input: Partial<CategoryInput>): Promise<Category> {
    return categoryRepository.update(id, input);
  }

  remove(id: string): Promise<void> {
    return categoryRepository.remove(id);
  }
}

export const categoryService: CategoryService = new SupabaseCategoryService();
