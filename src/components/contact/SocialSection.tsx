import { aboutImages, productImages, unsplashUrl } from '@/data/images';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Reveal } from '@/components/about/Reveal';

// No social API integration exists in this codebase, so this reuses already-sourced
// editorial imagery as a curated brand grid rather than fetching live posts.
const CURATED = [aboutImages.storyChapterTwo, aboutImages.customerTwo, productImages.coachJacketFront, aboutImages.globalVision];

/** 08 — editorial social section. Only Instagram is an actual configured link anywhere in this app (see Footer.tsx) — no other accounts are invented. */
export function SocialSection() {
  return (
    <section className="mx-auto max-w-[var(--container-max)] px-6 py-20 lg:px-8 lg:py-32">
      <Reveal>
        <div className="flex flex-col items-center text-center">
          <h2 className="text-3xl font-semibold uppercase tracking-tight text-ink sm:text-5xl">Follow the rare.</h2>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-accent underline-offset-4 hover:underline"
          >
            @x-rare on Instagram
          </a>
        </div>
      </Reveal>

      <div className="mt-12 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {CURATED.map((image, index) => (
          <Reveal key={image.id} delay={index * 0.05}>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="block aspect-square overflow-hidden bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <OptimizedImage
                src={unsplashUrl(image.id, { w: 600, h: 600 })}
                alt=""
                width={600}
                height={600}
                containerClassName="h-full w-full"
                className="transition-transform duration-[var(--duration-slow)] ease-[var(--ease-standard)] hover:scale-105"
              />
            </a>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
