import { faqRepository } from '@/repositories/faqRepository';
import type { Faq, FaqInput, FaqCategory } from '@/types/domain';

export const FAQ_CATEGORY_LABELS: Record<FaqCategory, string> = {
  orders: 'Orders',
  shipping: 'Shipping',
  returns_exchanges: 'Returns & Exchanges',
  products_sizing: 'Products & Sizing',
  payments: 'Payments',
  account: 'Account',
  collaborations: 'Collaborations',
};

export interface FaqService {
  listPublished(): Promise<Faq[]>;
  listForAdmin(): Promise<Faq[]>;
  create(input: FaqInput): Promise<Faq>;
  update(id: string, input: Partial<FaqInput>): Promise<Faq>;
  remove(id: string): Promise<void>;
  reorder(category: FaqCategory, orderedIds: string[]): Promise<void>;
  /** Case-insensitive match against question, answer, and category label — client-side since the published set is small enough to fetch once and filter instantly. */
  search(faqs: Faq[], query: string): Faq[];
}

class SupabaseFaqService implements FaqService {
  listPublished(): Promise<Faq[]> {
    return faqRepository.listPublished();
  }

  listForAdmin(): Promise<Faq[]> {
    return faqRepository.listForAdmin();
  }

  create(input: FaqInput): Promise<Faq> {
    return faqRepository.create(input);
  }

  update(id: string, input: Partial<FaqInput>): Promise<Faq> {
    return faqRepository.update(id, input);
  }

  remove(id: string): Promise<void> {
    return faqRepository.remove(id);
  }

  reorder(category: FaqCategory, orderedIds: string[]): Promise<void> {
    return faqRepository.reorder(category, orderedIds);
  }

  search(faqs: Faq[], query: string): Faq[] {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return faqs;
    return faqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(normalized) ||
        faq.answer.toLowerCase().includes(normalized) ||
        FAQ_CATEGORY_LABELS[faq.category].toLowerCase().includes(normalized),
    );
  }
}

export const faqService: FaqService = new SupabaseFaqService();
