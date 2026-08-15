import { Reveal } from '@/components/about/Reveal';

export interface CollaborationsProps {
  onCollaborate: () => void;
}

/** 07 — black-background CTA into the form, subject preselected to "Collaboration" by the parent. */
export function Collaborations({ onCollaborate }: CollaborationsProps) {
  return (
    <section className="bg-ink py-24 text-center lg:py-32">
      <div className="mx-auto max-w-2xl px-6">
        <Reveal>
          <h2 className="text-3xl font-semibold uppercase tracking-tight text-surface sm:text-5xl">Build something rare.</h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-surface/70">
            For collaborations, creative projects, press, partnerships, and opportunities — we'd love to hear from you.
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <button
            type="button"
            onClick={onCollaborate}
            className="mt-8 inline-flex h-12 items-center justify-center rounded-[var(--radius-button)] bg-surface px-8 text-xs font-semibold uppercase tracking-[var(--tracking-button)] text-ink transition-colors duration-[var(--duration-base)] hover:bg-surface/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Collaborate with X-Rare
          </button>
        </Reveal>
      </div>
    </section>
  );
}
