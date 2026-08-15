import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { aboutImages, unsplashUrl } from '@/data/images';
import { Reveal } from './Reveal';

const QUALITIES = ['Individual', 'Confident', 'Creative', 'Curious', 'Bold', 'Unapologetic'];

/** 07 — who X-Rare is for, told through typography and two lifestyle portraits rather than a "target audience" bullet list. */
export function TheCustomer() {
  return (
    <section className="mx-auto max-w-[var(--container-max)] px-6 py-20 lg:px-8 lg:py-32">
      <Reveal>
        <h2 className="text-center text-4xl font-semibold uppercase tracking-tight text-ink lg:text-7xl">For the rare.</h2>
      </Reveal>
      <Reveal delay={0.1}>
        <p className="mx-auto mt-6 max-w-md text-center text-sm text-ink/60">
          X-Rare is for people who refuse to disappear into the crowd.
        </p>
      </Reveal>

      <Reveal delay={0.15}>
        <ul className="mx-auto mt-12 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-3 text-center">
          {QUALITIES.map((quality, index) => (
            <li key={quality} className="flex items-center gap-6">
              <span className="text-lg font-semibold uppercase tracking-wide text-ink sm:text-2xl">{quality}</span>
              {index < QUALITIES.length - 1 ? <span className="text-accent" aria-hidden="true">·</span> : null}
            </li>
          ))}
        </ul>
      </Reveal>

      <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Reveal>
          <div className="aspect-[4/5] overflow-hidden bg-surface-muted">
            <OptimizedImage
              src={unsplashUrl(aboutImages.customerOne.id, { w: 900, h: 1125 })}
              alt={aboutImages.customerOne.alt}
              width={900}
              height={1125}
              containerClassName="h-full w-full"
            />
          </div>
        </Reveal>
        <Reveal delay={0.1} className="sm:mt-10">
          <div className="aspect-[4/5] overflow-hidden bg-surface-muted">
            <OptimizedImage
              src={unsplashUrl(aboutImages.customerTwo.id, { w: 900, h: 1125 })}
              alt={aboutImages.customerTwo.alt}
              width={900}
              height={1125}
              containerClassName="h-full w-full"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
