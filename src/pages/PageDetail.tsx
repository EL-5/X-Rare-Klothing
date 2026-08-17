import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Reveal } from '@/components/about/Reveal';
import { Skeleton } from '@/components/ui/Skeleton';
import { contentService } from '@/services/contentService';
import { useDocumentHead } from '@/hooks/useDocumentHead';
import { ROUTES } from '@/config/routes';
import type { Page } from '@/repositories/contentRepository';

/** Public renderer for admin-authored CMS pages (Privacy Policy, Terms of Service, etc.) — one generic route for any published `pages` row, so new legal/informational pages never need new frontend code. */
export function PageDetail() {
  const { slug = '' } = useParams<{ slug: string }>();
  const [page, setPage] = useState<Page | null | undefined>(undefined);

  useEffect(() => {
    setPage(undefined);
    contentService.getPageBySlug(slug).then(setPage);
  }, [slug]);

  useDocumentHead({
    title: page ? (page.seoTitle ?? page.title) : 'Page',
    description: page?.seoDescription ?? undefined,
    path: ROUTES.page(slug),
    noindex: page === null,
  });

  if (page === undefined) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 lg:px-8">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="mt-6 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-5/6" />
      </div>
    );
  }

  if (page === null) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center lg:px-8">
        <h1 className="text-xl font-semibold uppercase tracking-wide text-ink">Page not found</h1>
        <p className="mt-2 text-sm text-ink/60">This page doesn't exist or isn't published yet.</p>
        <Link to={ROUTES.home} className="mt-4 inline-block text-sm text-ink underline-offset-2 hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  // Lightweight authoring convention for admin-written body text: a block
  // starting with "## " renders as a section heading, everything else as a
  // paragraph — enough structure for a legal document without a markdown parser.
  const blocks = (page.body ?? '').split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 lg:px-8 lg:py-24">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">Legal</p>
        <h1 className="mt-3 text-2xl font-semibold uppercase tracking-tight text-ink lg:text-4xl">{page.title}</h1>
      </Reveal>

      {blocks.length > 0 ? (
        <Reveal delay={0.1}>
          <div className="mt-10 flex flex-col gap-4">
            {blocks.map((block, index) =>
              block.startsWith('## ') ? (
                <h2 key={index} className="mt-4 text-sm font-semibold uppercase tracking-wide text-ink first:mt-0">
                  {block.slice(3)}
                </h2>
              ) : (
                <p key={index} className="whitespace-pre-line text-sm leading-relaxed text-ink/70">
                  {block}
                </p>
              ),
            )}
          </div>
        </Reveal>
      ) : null}
    </div>
  );
}
