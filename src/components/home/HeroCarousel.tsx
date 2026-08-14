import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

export interface HeroSlide {
  id: string;
  eyebrow?: string;
  heading: string;
  subheading?: string;
  ctaLabel: string;
  ctaHref: string;
  imageDesktop: string;
  imageMobile: string;
}

export interface HeroCarouselProps {
  slides: HeroSlide[];
  autoplayIntervalMs?: number;
}

const SWIPE_THRESHOLD_PX = 50;

/**
 * Cross-fade hero carousel — mirrors the reference's Flickity slideshow
 * (`is-fade` cross-fade transition, custom dot pagination, swipe-enabled,
 * distinct mobile/desktop crop; see docs/animation-inventory.md). Built with
 * native pointer events + CSS opacity transitions instead of a carousel
 * dependency, so it degrades to a single static slide with JS disabled.
 */
export function HeroCarousel({ slides, autoplayIntervalMs = 6000 }: HeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const dragStartX = useRef<number | null>(null);

  const goTo = useCallback((index: number) => setActiveIndex(((index % slides.length) + slides.length) % slides.length), [slides.length]);
  const next = useCallback(() => goTo(activeIndex + 1), [goTo, activeIndex]);
  const prev = useCallback(() => goTo(activeIndex - 1), [goTo, activeIndex]);

  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const timer = setInterval(next, autoplayIntervalMs);
    return () => clearInterval(timer);
  }, [isPaused, next, autoplayIntervalMs, slides.length]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      next();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      prev();
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    dragStartX.current = event.clientX;
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStartX.current === null) return;
    const delta = event.clientX - dragStartX.current;
    dragStartX.current = null;
    if (delta > SWIPE_THRESHOLD_PX) prev();
    else if (delta < -SWIPE_THRESHOLD_PX) next();
  };

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      className="relative h-[500px] w-full touch-pan-y select-none overflow-hidden bg-surface-muted outline-none lg:h-[680px]"
    >
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          aria-hidden={index !== activeIndex}
          className={cn(
            'absolute inset-0 transition-opacity duration-[var(--duration-slow)] ease-[var(--ease-standard)]',
            index === activeIndex ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
        >
          <picture>
            <source media="(min-width: 768px)" srcSet={slide.imageDesktop} />
            <img
              src={slide.imageMobile}
              alt=""
              width={900}
              height={1125}
              loading={index === 0 ? 'eager' : 'lazy'}
              fetchPriority={index === 0 ? 'high' : 'auto'}
              className="h-full w-full object-cover"
            />
          </picture>
          <div className="absolute inset-0 bg-ink/20" />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-surface">
            {slide.eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.2em]">{slide.eyebrow}</p> : null}
            <h1 className="mt-3 max-w-xl text-3xl font-semibold uppercase tracking-wide lg:text-5xl">{slide.heading}</h1>
            {slide.subheading ? <p className="mt-4 max-w-md text-sm text-surface/90">{slide.subheading}</p> : null}
            <Link
              to={slide.ctaHref}
              tabIndex={index === activeIndex ? 0 : -1}
              className="mt-8 inline-flex h-12 items-center justify-center rounded-[var(--radius-button)] bg-surface px-8 text-sm font-medium uppercase tracking-[var(--tracking-button)] text-ink transition-colors duration-[var(--duration-base)] hover:bg-surface/90"
            >
              {slide.ctaLabel}
            </Link>
          </div>
        </div>
      ))}

      {slides.length > 1 ? (
        <div className="absolute inset-x-0 bottom-6 flex items-center justify-center gap-2">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === activeIndex}
              onClick={() => goTo(index)}
              className={cn(
                'h-1.5 rounded-full transition-all duration-[var(--duration-base)]',
                index === activeIndex ? 'w-6 bg-surface' : 'w-1.5 bg-surface/50 hover:bg-surface/80',
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
