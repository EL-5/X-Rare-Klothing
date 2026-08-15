import { useEffect, useState } from 'react';
import { settingsService } from '@/services/settingsService';
import { useDocumentHead } from '@/hooks/useDocumentHead';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { editorialImages, unsplashUrl } from '@/data/images';

export function Contact() {
  const [supportEmail, setSupportEmail] = useState<string | null>(null);

  useDocumentHead({
    title: 'Contact',
    description: "Questions about an order, sizing, or anything else — we're here to help.",
    path: '/contact',
  });

  useEffect(() => {
    settingsService.getAll().then((settings) => {
      const email = settings.support_email;
      if (typeof email === 'string' && email) setSupportEmail(email);
    });
  }, []);

  return (
    <div>
      <div className="relative h-[160px] w-full overflow-hidden bg-surface-muted lg:h-[220px]">
        <OptimizedImage
          src={unsplashUrl(editorialImages.contactBanner.id, { w: 1600, h: 500 })}
          alt={editorialImages.contactBanner.alt}
          width={1600}
          height={500}
          containerClassName="h-full w-full"
          loading="eager"
        />
      </div>

      <div className="mx-auto max-w-2xl px-6 py-[var(--spacing-section-mobile)] lg:px-8 lg:py-[var(--spacing-section-desktop)]">
      <h1 className="text-xs font-semibold uppercase tracking-wide text-ink">Contact Us</h1>
      <p className="mt-4 text-sm leading-relaxed text-ink/70">
        Questions about an order, sizing, or anything else — we're here to help.
      </p>

      <dl className="mt-8 flex flex-col gap-6 text-sm">
        <div>
          <dt className="font-semibold uppercase tracking-wide text-ink">Email</dt>
          <dd className="mt-1 text-ink/70">
            <a href={`mailto:${supportEmail ?? 'support@x-rare.com'}`} className="underline-offset-2 hover:underline">
              {supportEmail ?? 'support@x-rare.com'}
            </a>
          </dd>
        </div>
        <div>
          <dt className="font-semibold uppercase tracking-wide text-ink">Instagram</dt>
          <dd className="mt-1 text-ink/70">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">
              Instagram
            </a>
          </dd>
        </div>
      </dl>
      </div>
    </div>
  );
}
