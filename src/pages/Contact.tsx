import { useEffect, useState } from 'react';
import { settingsService } from '@/services/settingsService';

export function Contact() {
  const [supportEmail, setSupportEmail] = useState<string | null>(null);

  useEffect(() => {
    settingsService.getAll().then((settings) => {
      const email = settings.support_email;
      if (typeof email === 'string' && email) setSupportEmail(email);
    });
  }, []);

  return (
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
  );
}
