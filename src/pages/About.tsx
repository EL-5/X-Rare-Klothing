import { useDocumentHead } from '@/hooks/useDocumentHead';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { editorialImages, unsplashUrl } from '@/data/images';

export function About() {
  useDocumentHead({
    title: 'About',
    description: 'The story behind X-Rare — rare by design, different by nature.',
    path: '/about',
  });

  return (
    <div>
      <div className="relative h-[320px] w-full overflow-hidden bg-surface-muted lg:h-[440px]">
        <OptimizedImage
          src={unsplashUrl(editorialImages.aboutHero.id, { w: 2000, h: 1100 })}
          alt={editorialImages.aboutHero.alt}
          width={2000}
          height={1100}
          containerClassName="h-full w-full"
          loading="eager"
        />
        <div className="absolute inset-0 bg-ink/30" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <h1 className="text-xs font-semibold uppercase tracking-wide text-surface/80">Our Story</h1>
          <p className="mt-3 max-w-xl text-2xl font-semibold uppercase tracking-wide text-surface lg:text-4xl">
            Rare by design. Different by nature.
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-6 py-[var(--spacing-section-mobile)] lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-[var(--spacing-section-desktop)]">
        <div className="flex flex-col gap-6 text-sm leading-relaxed text-ink/70">
          <p>
            X-Rare was created from the belief that being different should be celebrated rather than hidden. Fashion
            today can sometimes feel repetitive, with everyone wearing the same styles and following the same trends —
            X-Rare was created for the person who wants something different.
          </p>
          <p>
            The X represents crossing boundaries, breaking limits, and creating your own identity. The idea behind
            "Rare" is that every person has something unique about them. X-Rare is made for people who do not want to
            look, think, or move like everybody else.
          </p>
        </div>

        <div className="aspect-[4/5] overflow-hidden bg-surface-muted">
          <OptimizedImage
            src={unsplashUrl(editorialImages.aboutSecondary.id, { w: 900, h: 1125 })}
            alt={editorialImages.aboutSecondary.alt}
            width={900}
            height={1125}
            containerClassName="h-full w-full"
          />
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 pb-[var(--spacing-section-mobile)] lg:px-8 lg:pb-[var(--spacing-section-desktop)]">
        <div className="flex flex-col gap-6 text-sm leading-relaxed text-ink/70">
          <p>
            The brand combines streetwear culture, modern fashion, and premium design to create clothing that can be
            worn casually while still looking expensive and sophisticated. X-Rare is not only about putting a logo on
            clothing — every collection represents identity, confidence, individuality, movement, and exclusivity.
          </p>
          <p>When you wear X-Rare, the goal is for you to feel like you're wearing something that represents who you are, rather than simply following a trend.</p>
        </div>
      </div>
    </div>
  );
}
