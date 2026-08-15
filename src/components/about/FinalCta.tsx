import { Link } from 'react-router-dom';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { aboutImages, unsplashUrl } from '@/data/images';
import { ROUTES } from '@/config/routes';
import { Reveal } from './Reveal';

/** 10 — closes the page like the end of a campaign: full-bleed image, one line, two ways forward. */
export function FinalCta() {
  return (
    <section className="relative h-[75vh] w-full overflow-hidden bg-ink lg:h-[90vh]">
      <OptimizedImage
        src={unsplashUrl(aboutImages.finalCta.id, { w: 2400, h: 2800 })}
        alt={aboutImages.finalCta.alt}
        width={2400}
        height={2800}
        containerClassName="h-full w-full"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-ink/30" />

      <div className="absolute inset-0 flex flex-col items-center justify-end px-6 pb-16 text-center lg:pb-24">
        <Reveal>
          <h2 className="text-4xl font-semibold uppercase tracking-tight text-surface sm:text-6xl lg:text-7xl">Define your edge.</h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.3em] text-accent">Explore X-Rare</p>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to={ROUTES.collection('new-in')}
              className="inline-flex h-12 items-center justify-center rounded-[var(--radius-button)] bg-surface px-8 text-xs font-semibold uppercase tracking-[var(--tracking-button)] text-ink transition-colors duration-[var(--duration-base)] hover:bg-surface/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Shop New In
            </Link>
            <Link
              to={ROUTES.collections}
              className="inline-flex h-12 items-center justify-center rounded-[var(--radius-button)] border border-surface px-8 text-xs font-semibold uppercase tracking-[var(--tracking-button)] text-surface transition-colors duration-[var(--duration-base)] hover:bg-surface hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Explore Collections
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
