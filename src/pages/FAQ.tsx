import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDocumentHead } from '@/hooks/useDocumentHead';
import { useStructuredData } from '@/hooks/useStructuredData';
import { faqService } from '@/services/faqService';
import { FaqHero } from '@/components/faq/FaqHero';
import { FaqSearch } from '@/components/faq/FaqSearch';
import { FaqCategoryNav } from '@/components/faq/FaqCategoryNav';
import { FaqList } from '@/components/faq/FaqList';
import { MostAsked } from '@/components/faq/MostAsked';
import { StillNeedHelp } from '@/components/faq/StillNeedHelp';
import { FaqEditorial } from '@/components/faq/FaqEditorial';
import { FaqFinalCta } from '@/components/faq/FaqFinalCta';
import type { Faq, FaqCategory } from '@/types/domain';

/** Curated, not fabricated — the first published FAQ from each of these categories, in priority order. Falls back gracefully if a category has no entries. */
const MOST_ASKED_CATEGORIES: FaqCategory[] = ['products_sizing', 'shipping', 'returns_exchanges', 'orders', 'payments', 'shipping'];

export function FAQ() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') as FaqCategory | null;

  const [faqs, setFaqs] = useState<Faq[] | null>(null);
  const [query, setQuery] = useState('');
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [hasHandledDeepLink, setHasHandledDeepLink] = useState(false);

  useDocumentHead({
    title: 'X-Rare FAQ — Frequently Asked Questions',
    description: 'Find answers about X-Rare orders, shipping, returns, sizing, payments, products and customer support.',
    path: '/faq',
  });

  useEffect(() => {
    faqService.listPublished().then(setFaqs);
  }, []);

  // Deep link: /faq#slug opens and scrolls to that entry once the data has loaded.
  useEffect(() => {
    if (!faqs || hasHandledDeepLink) return;
    const hash = window.location.hash.replace('#', '');
    if (hash && faqs.some((f) => f.slug === hash)) {
      setOpenSlug(hash);
      setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'auto', block: 'center' });
      }, 100);
    }
    setHasHandledDeepLink(true);
  }, [faqs, hasHandledDeepLink]);

  const categories = useMemo(() => {
    if (!faqs) return [];
    const order: FaqCategory[] = ['orders', 'shipping', 'returns_exchanges', 'products_sizing', 'payments', 'account', 'collaborations'];
    const present = new Set(faqs.map((f) => f.category));
    return order.filter((c) => present.has(c));
  }, [faqs]);

  const categoryFiltered = useMemo(() => {
    if (!faqs) return [];
    return categoryParam ? faqs.filter((f) => f.category === categoryParam) : faqs;
  }, [faqs, categoryParam]);

  const visible = useMemo(() => faqService.search(categoryFiltered, query), [categoryFiltered, query]);

  const mostAsked = useMemo(() => {
    if (!faqs) return [];
    const picked: Faq[] = [];
    for (const category of MOST_ASKED_CATEGORIES) {
      const match = faqs.find((f) => f.category === category && !picked.includes(f));
      if (match && !picked.some((p) => p.id === match.id)) picked.push(match);
      if (picked.length >= 6) break;
    }
    return picked;
  }, [faqs]);

  useStructuredData(
    faqs && faqs.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: { '@type': 'Answer', text: faq.answer },
          })),
        }
      : null,
  );

  const handleSelectCategory = (category: FaqCategory | null) => {
    setSearchParams(category ? { category } : {}, { replace: true });
  };

  const handleSelectFaq = (slug: string) => {
    setQuery('');
    setSearchParams({}, { replace: true });
    setOpenSlug(slug);
    setTimeout(() => {
      document.getElementById(slug)?.scrollIntoView({ behavior: 'auto', block: 'center' });
    }, 350);
  };

  return (
    <div>
      <FaqHero />
      <FaqSearch value={query} onChange={setQuery} />
      {categories.length > 0 ? <FaqCategoryNav categories={categories} selected={categoryParam} onSelect={handleSelectCategory} /> : null}

      {faqs === null ? (
        <p className="py-20 text-center text-sm text-ink/50">Loading…</p>
      ) : (
        <FaqList faqs={visible} query={query} openSlug={openSlug} onToggle={(slug) => setOpenSlug((current) => (current === slug ? null : slug))} />
      )}

      <MostAsked faqs={mostAsked} onSelect={handleSelectFaq} />
      <StillNeedHelp />
      <FaqEditorial />
      <FaqFinalCta />
    </div>
  );
}
