import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface ProductGalleryProps {
  images: string[];
  title: string;
  /** When set and present in `images`, the gallery jumps to it — how a variant's pinned photo swaps the active image (see docs/interaction-map.md). */
  activeImageUrl?: string | null;
}

const SWIPE_THRESHOLD_PX = 50;

/**
 * Main image + thumbnail rail, prev/next, swipe, keyboard, cross-fade
 * transitions. No zoom — the audit never confirmed a zoom interaction on
 * the reference PDP (see docs/component-inventory.md), so per the batch's
 * "zoom if present in audit" instruction, it's intentionally omitted.
 */
export function ProductGallery({ images, title, activeImageUrl }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const dragStartX = useRef<number | null>(null);

  useEffect(() => {
    if (!activeImageUrl) return;
    const index = images.indexOf(activeImageUrl);
    if (index !== -1) setActiveIndex(index);
  }, [activeImageUrl, images]);

  useEffect(() => {
    setActiveIndex(0);
  }, [images]);

  const goTo = (index: number) => setActiveIndex(((index % images.length) + images.length) % images.length);
  const next = () => goTo(activeIndex + 1);
  const prev = () => goTo(activeIndex - 1);

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

  if (images.length === 0) {
    return <div className="aspect-[4/5] w-full bg-surface-muted" />;
  }

  return (
    <div className="flex flex-col-reverse gap-4 lg:flex-row">
      {images.length > 1 ? (
        <div className="flex gap-3 overflow-x-auto lg:w-20 lg:shrink-0 lg:flex-col lg:overflow-y-auto">
          {images.map((image, index) => (
            <button
              key={image + index}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`View image ${index + 1}`}
              aria-current={index === activeIndex}
              className={cn(
                'aspect-[4/5] w-16 shrink-0 overflow-hidden border transition-colors lg:w-full',
                index === activeIndex ? 'border-ink' : 'border-transparent hover:border-border',
              )}
            >
              <img src={image} alt="" loading="lazy" width={200} height={250} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      <div
        role="region"
        aria-roledescription="carousel"
        aria-label={`${title} images`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className="relative aspect-[4/5] flex-1 touch-pan-y select-none overflow-hidden bg-surface-muted outline-none"
      >
        {images.map((image, index) => (
          <img
            key={image + index}
            src={image}
            alt={title}
            width={800}
            height={1000}
            loading={index === 0 ? 'eager' : 'lazy'}
            fetchPriority={index === 0 ? 'high' : 'auto'}
            aria-hidden={index !== activeIndex}
            className={cn(
              'absolute inset-0 h-full w-full object-cover transition-opacity duration-[var(--duration-base)] ease-[var(--ease-standard)]',
              index === activeIndex ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
          />
        ))}

        {images.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={prev}
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center bg-surface/80 text-ink transition-colors hover:bg-surface"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={next}
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center bg-surface/80 text-ink transition-colors hover:bg-surface"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 right-3 bg-surface/80 px-2 py-1 text-xs text-ink">
              {activeIndex + 1} / {images.length}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
