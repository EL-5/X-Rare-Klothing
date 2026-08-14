export interface EditorialConfig {
  label: string;
  repeatedText: string;
  body: string;
}

/**
 * Brand-statement marquee — the reference reuses its announcement-bar
 * scrolling-text mechanism for the About page's "OUR STORY" brand strip
 * (see docs/animation-inventory.md: "same underlying scrolling-text
 * mechanism reused for both a functional (promo) and decorative (brand
 * statement) purpose"). Same `animate-marquee` keyframe as AnnouncementBar.
 */
export function EditorialSection({ label, repeatedText, body }: EditorialConfig) {
  return (
    <section className="border-y border-border bg-surface-muted py-[var(--spacing-section-mobile)] lg:py-[var(--spacing-section-desktop)]">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-ink/60">{label}</p>

      <div className="mt-6 overflow-hidden">
        <div className="flex w-max animate-marquee gap-16 whitespace-nowrap" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, index) => (
            <span key={index} className="text-4xl font-semibold uppercase tracking-wide text-ink/15 lg:text-6xl">
              {repeatedText}
            </span>
          ))}
        </div>
      </div>

      <p className="mx-auto mt-6 max-w-lg px-6 text-center text-sm text-ink/70">{body}</p>
    </section>
  );
}
