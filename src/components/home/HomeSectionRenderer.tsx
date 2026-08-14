import { HeroCarousel, type HeroSlide } from './HeroCarousel';
import { PromotionalBanner, type PromoBannerConfig } from './PromotionalBanner';
import { EditorialSection, type EditorialConfig } from './EditorialSection';
import { ProductCarouselSection, type ProductCarouselConfig } from './ProductCarouselSection';
import { CategoryGrid } from './CategoryGrid';
import { Newsletter } from '@/components/layout/Newsletter';
import type { HomepageSection } from '@/types/domain';

/** Renders one admin-configured homepage_sections row — the type dictates which component owns its `config` shape. */
export function HomeSectionRenderer({ section }: { section: HomepageSection }) {
  switch (section.type) {
    case 'hero': {
      const slides = (section.config.slides as HeroSlide[] | undefined) ?? [];
      if (slides.length === 0) return null;
      return <HeroCarousel slides={slides} />;
    }
    case 'product_carousel':
      return <ProductCarouselSection config={section.config as unknown as ProductCarouselConfig} />;
    case 'banner':
      return <PromotionalBanner banner={section.config as unknown as PromoBannerConfig} />;
    case 'editorial':
      return <EditorialSection {...(section.config as unknown as EditorialConfig)} />;
    case 'category_grid':
      return <CategoryGrid />;
    case 'newsletter': {
      const config = section.config as { heading?: string; incentive?: string };
      return (
        <div className="bg-footer px-6 py-[var(--spacing-section-mobile)] lg:py-[var(--spacing-section-desktop)]">
          <div className="mx-auto max-w-md text-center">
            <Newsletter heading={config.heading} incentive={config.incentive} />
          </div>
        </div>
      );
    }
    default:
      return null;
  }
}
