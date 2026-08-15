import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { aboutImages, unsplashUrl } from '@/data/images';
import { cn } from '@/lib/cn';
import { Reveal } from './Reveal';

const CHAPTERS = [
  {
    label: 'Chapter 01',
    heading: "The world doesn't need another copy.",
    body: 'Fashion can sometimes feel repetitive, with everyone following the same trends and wearing the same styles.',
    image: aboutImages.storyChapterOne,
  },
  {
    label: 'Chapter 02',
    heading: 'So we created something different.',
    body: 'X-Rare was created for the person who wants something different.',
    image: aboutImages.storyChapterTwo,
  },
  {
    label: 'Chapter 03',
    heading: 'Identity over trends.',
    body: 'The brand combines streetwear culture, modern fashion, and premium design to create clothing that feels casual, sophisticated, and unmistakably individual.',
    image: aboutImages.storyChapterThree,
  },
];

/** 04 — the brand story told as three short editorial chapters with alternating image/text layout, not one long paragraph. */
export function StoryChapters() {
  return (
    <section className="py-4 lg:py-8">
      {CHAPTERS.map((chapter, index) => {
        const imageFirst = index % 2 === 0;
        return (
          <div key={chapter.label} className="mx-auto grid max-w-[var(--container-max)] grid-cols-1 items-center gap-8 px-6 py-16 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
            <Reveal className={cn(imageFirst ? 'lg:order-1' : 'lg:order-2')}>
              <div className="aspect-[4/5] overflow-hidden bg-surface-muted">
                <OptimizedImage
                  src={unsplashUrl(chapter.image.id, { w: 1000, h: 1250 })}
                  alt={chapter.image.alt}
                  width={1000}
                  height={1250}
                  containerClassName="h-full w-full"
                />
              </div>
            </Reveal>

            <Reveal delay={0.1} className={cn(imageFirst ? 'lg:order-2' : 'lg:order-1')}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{chapter.label}</p>
              <h3 className="mt-4 text-2xl font-semibold uppercase leading-tight text-ink lg:text-4xl">{chapter.heading}</h3>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-ink/60">{chapter.body}</p>
            </Reveal>
          </div>
        );
      })}
    </section>
  );
}
