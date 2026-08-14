import {
  productRepository,
  type AdminListProductsParams,
  type ListProductsParams,
  type ProductFormInput,
  type VariantFormInput,
} from '@/repositories/productRepository';
import type { Paginated, Product, ProductVariant } from '@/types/domain';

export interface ProductService {
  getBySlug(slug: string): Promise<Product | null>;
  list(params?: ListProductsParams): Promise<Paginated<Product>>;
  getRelated(product: Product, limit?: number): Promise<Product[]>;
  getSalesCounts(): Promise<Map<string, number>>;

  // Admin
  getById(id: string): Promise<Product | null>;
  listForAdmin(params?: AdminListProductsParams): Promise<Paginated<Product>>;
  create(input: ProductFormInput): Promise<Product>;
  update(id: string, input: Partial<ProductFormInput>): Promise<Product>;
  remove(id: string): Promise<void>;
  createVariant(productId: string, input: VariantFormInput): Promise<ProductVariant>;
  updateVariant(id: string, input: Partial<VariantFormInput>): Promise<ProductVariant>;
  removeVariant(id: string): Promise<void>;

  // Lifecycle
  publish(id: string): Promise<Product>;
  unpublish(id: string): Promise<Product>;
  archive(id: string): Promise<Product>;
  duplicate(id: string): Promise<Product>;

  listNamesForAdmin(): Promise<{ id: string; name: string }[]>;
}

class SupabaseProductService implements ProductService {
  getBySlug(slug: string): Promise<Product | null> {
    return productRepository.getBySlug(slug);
  }

  list(params: ListProductsParams = {}): Promise<Paginated<Product>> {
    return productRepository.list(params);
  }

  /** "You might also be interested in" — same category, excluding the current product, price-agnostic for now. */
  async getRelated(product: Product, limit = 4): Promise<Product[]> {
    const { items } = await productRepository.list({ pageSize: limit + 1 });
    return items.filter((item) => item.id !== product.id).slice(0, limit);
  }

  getSalesCounts(): Promise<Map<string, number>> {
    return productRepository.getSalesCounts();
  }

  getById(id: string): Promise<Product | null> {
    return productRepository.getById(id);
  }

  listForAdmin(params: AdminListProductsParams = {}): Promise<Paginated<Product>> {
    return productRepository.listForAdmin(params);
  }

  create(input: ProductFormInput): Promise<Product> {
    return productRepository.create(input);
  }

  update(id: string, input: Partial<ProductFormInput>): Promise<Product> {
    return productRepository.update(id, input);
  }

  remove(id: string): Promise<void> {
    return productRepository.remove(id);
  }

  createVariant(productId: string, input: VariantFormInput): Promise<ProductVariant> {
    return productRepository.createVariant(productId, input);
  }

  updateVariant(id: string, input: Partial<VariantFormInput>): Promise<ProductVariant> {
    return productRepository.updateVariant(id, input);
  }

  removeVariant(id: string): Promise<void> {
    return productRepository.removeVariant(id);
  }

  publish(id: string): Promise<Product> {
    return productRepository.update(id, { status: 'active' });
  }

  unpublish(id: string): Promise<Product> {
    return productRepository.update(id, { status: 'draft' });
  }

  archive(id: string): Promise<Product> {
    return productRepository.update(id, { status: 'archived' });
  }

  duplicate(id: string): Promise<Product> {
    return productRepository.duplicate(id);
  }

  listNamesForAdmin(): Promise<{ id: string; name: string }[]> {
    return productRepository.listNamesForAdmin();
  }
}

export const productService: ProductService = new SupabaseProductService();
