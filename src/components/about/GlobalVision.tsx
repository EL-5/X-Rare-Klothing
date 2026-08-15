import { useReducedMotion } from 'framer-motion';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { aboutImages, unsplashUrl } from '@/data/images';
import { cn } from '@/lib/cn';
import { Reveal } from './Reveal';

const CATALOGUE = [
  'Premium T-Shirts',
  'Hoodies',
  'Jackets',
  'Denim',
  'Pants',
  'Tracksuits',
  'Caps',
  'Trucker Hats',
  'Bags',
  'Footwear',
  'Accessories',
  'Limited Editions',
  'Collaborations',
];

/** 06 — African-born, globally-ambitious positioning. Cinematic cover + a marquee catalogue instead of a bullet list. */
export function GlobalVision() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="bg-surface-muted">
      <div className="relative h-[70vh] w-full overflow-hidden bg-ink lg:h-[85vh]">
        <OptimizedImage
          src={unsplashUrl(aboutImages.globalVision.id, { w: 2400, h: 2400 })}
          alt={aboutImages.globalVision.alt}
          width={2400}
          height={2400}
          containerClassName="h-full w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-ink/10" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-6 pb-14 text-center lg:pb-20">
          <Reveal>
            <h2 className="text-3xl font-semibold uppercase leading-tight text-surface lg:text-6xl">
              Born in Africa.
              <br />
              Built for the world.
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-6 max-w-lg text-sm leading-relaxed text-surface/80">
              X-Rare's long-term vision is to become a globally recognized African-born fashion and lifestyle brand — a
              complete fashion house, built one collection at a time.
            </p>
          </Reveal>
        </div>
      </div>

      <div className={cn('overflow-hidden border-b border-border py-8', prefersReducedMotion ? 'overflow-x-auto' : null)}>
        <div className={cn('flex w-max gap-10 whitespace-nowrap', prefersReducedMotion ? null : 'animate-marquee')} aria-hidden="true">
          {(prefersReducedMotion ? CATALOGUE : [...CATALOGUE, ...CATALOGUE]).map((item, index) => (
            <span key={`${item}-${index}`} className="flex items-center gap-10 text-lg font-semibold uppercase tracking-wide text-ink/70">
              {item}
              <span className="text-accent">/</span>
            </span>
          ))}
        </div>
        <span className="sr-only">
          Future categories: {CATALOGUE.join(', ')}.
        </span>
      </div>
    </section>
  );
}
