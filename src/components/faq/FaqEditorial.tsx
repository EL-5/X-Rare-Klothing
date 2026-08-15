import { Link } from 'react-router-dom';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { aboutImages, unsplashUrl } from '@/data/images';
import { ROUTES } from '@/config/routes';
import { Reveal } from '@/components/about/Reveal';

/** 09 — one strong editorial break so the FAQ page doesn't read as an all-white support template; reuses an already-sourced/licensed image rather than fetching a new one. */
export function FaqEditorial() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2">
      <Reveal className="order-2 aspect-[4/5] overflow-hidden bg-surface-muted lg:order-1 lg:aspect-auto">
        <OptimizedImage
          src={unsplashUrl(aboutImages.customerTwo.id, { w: 1200, h: 1500 })}
          alt={aboutImages.customerTwo.alt}
          width={1200}
          height={1500}
          containerClassName="h-full w-full"
        />
      </Reveal>

      <div className="order-1 flex flex-col items-start justify-center bg-ink px-8 py-16 lg:order-2 lg:px-16 lg:py-0">
        <Reveal>
          <h2 className="text-3xl font-semibold uppercase tracking-tight text-surface sm:text-5xl">Wear your difference.</h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-surface/70">
            Questions are easy. Finding your style is the fun part.
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <Link
            to={ROUTES.collection('new-in')}
            className="mt-8 inline-flex h-12 items-center justify-center rounded-[var(--radius-button)] bg-surface px-8 text-xs font-semibold uppercase tracking-[var(--tracking-button)] text-ink transition-colors duration-[var(--duration-base)] hover:bg-surface/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Shop New In
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
