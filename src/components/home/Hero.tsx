import { HeroCarousel } from './HeroCarousel';
import { heroSlides } from '@/config/homepage';

export function Hero() {
  return <HeroCarousel slides={heroSlides} />;
}
