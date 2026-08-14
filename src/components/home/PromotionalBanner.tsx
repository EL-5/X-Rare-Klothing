import { Link } from 'react-router-dom';
import type { PromoBanner } from '@/config/homepage';

export interface PromotionalBannerProps {
  banner: PromoBanner;
}

/** Full-bleed image + overlaid heading + CTA — the reference's "CategoryPromoBlock" (NEW RELEASES, TRACKSUITS; see docs/component-inventory.md). */
export function PromotionalBanner({ banner }: PromotionalBannerProps) {
  return (
    <Link to={banner.cta.href} className="group relative block aspect-[16/9] w-full overflow-hidden lg:aspect-[21/9]">
      <img
        src={banner.image}
        alt=""
        width={1400}
        height={900}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-[var(--duration-slow)] ease-[var(--ease-standard)] group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-ink/25" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center text-surface">
        <h2 className="text-2xl font-semibold uppercase tracking-wide lg:text-4xl">{banner.heading}</h2>
        <span className="text-xs font-semibold uppercase tracking-[0.2em] underline-offset-4 group-hover:underline">
          {banner.cta.label}
        </span>
      </div>
    </Link>
  );
}
