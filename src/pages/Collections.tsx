import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { collectionService } from '@/services/collectionService';
import { CollectionsHero } from '@/components/collections/CollectionsHero';
import { CollectionShowcase } from '@/components/collections/CollectionShowcase';
import { Reveal } from '@/components/about/Reveal';
import { ROUTES } from '@/config/routes';
import { useDocumentHead } from '@/hooks/useDocumentHead';
import type { Collection } from '@/types/domain';

/** Public index of published collections — a curated editorial landing page, not a plain tile grid. */
export function Collections() {
  const [collections, setCollections] = useState<Collection[] | null>(null);
  const [counts, setCounts] = useState<Map<string, number>>(new Map());

  useDocumentHead({
    title: 'Collections',
    description: "Curated seasonal edits and hand-picked drops from X-Rare — not everything makes the cut, here's what's live right now.",
    path: '/collections',
  });

  useEffect(() => {
    let cancelled = false;
    collectionService.list().then((list) => {
      if (cancelled) return;
      setCollections(list);
      Promise.all(list.map((collection) => collectionService.countProducts(collection.id))).then((results) => {
        if (cancelled) return;
        setCounts(new Map(list.map((collection, index) => [collection.id, results[index]])));
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <CollectionsHero />
      <CollectionShowcase collections={collections} counts={counts} />

      {collections && collections.length > 0 ? (
        <section className="mx-auto max-w-[var(--container-max)] border-t border-border px-6 py-16 text-center lg:px-8 lg:py-24">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">Looking for something specific?</p>
            <Link
              to={ROUTES.shop}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-ink underline-offset-4 hover:underline"
            >
              Shop the full range <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Reveal>
        </section>
      ) : null}
    </div>
  );
}
