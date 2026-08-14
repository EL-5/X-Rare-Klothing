import { Hero } from '@/components/home/Hero';
import { PromotionalBanner } from '@/components/home/PromotionalBanner';
import { BestSellers } from '@/components/home/BestSellers';
import { NewIn } from '@/components/home/NewIn';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { AccessoriesSection } from '@/components/home/AccessoriesSection';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { EditorialSection } from '@/components/home/EditorialSection';
import { ExploreMore } from '@/components/home/ExploreMore';
import { promotionalBanners } from '@/config/homepage';

/** Newsletter and Footer render globally in RootLayout, so they aren't repeated here. */
export function Home() {
  return (
    <div>
      <Hero />
      <BestSellers />
      {promotionalBanners[0] ? <PromotionalBanner banner={promotionalBanners[0]} /> : null}
      <NewIn />
      <CategoryGrid />
      <AccessoriesSection />
      {promotionalBanners[1] ? <PromotionalBanner banner={promotionalBanners[1]} /> : null}
      <FeaturedProducts />
      <EditorialSection />
      <ExploreMore />
    </div>
  );
}
