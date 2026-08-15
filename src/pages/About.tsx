import { useDocumentHead } from '@/hooks/useDocumentHead';
import { AboutHero } from '@/components/about/AboutHero';
import { BrandStatement } from '@/components/about/BrandStatement';
import { MeaningOfX } from '@/components/about/MeaningOfX';
import { StoryChapters } from '@/components/about/StoryChapters';
import { TheCode } from '@/components/about/TheCode';
import { GlobalVision } from '@/components/about/GlobalVision';
import { TheCustomer } from '@/components/about/TheCustomer';
import { TheFuture } from '@/components/about/TheFuture';
import { Manifesto } from '@/components/about/Manifesto';
import { FinalCta } from '@/components/about/FinalCta';

/** Premium fashion-editorial About page — told through photography, typography, and motion rather than paragraphs (see docs/about-page-redesign.md). */
export function About() {
  useDocumentHead({
    title: 'About — Rare by Design',
    description:
      'Discover the story behind X-Rare, an African-born fashion brand built around individuality, confidence, exclusivity and the freedom to define your own identity.',
    path: '/about',
  });

  return (
    <div>
      <AboutHero />
      <BrandStatement />
      <MeaningOfX />
      <StoryChapters />
      <TheCode />
      <GlobalVision />
      <TheCustomer />
      <TheFuture />
      <Manifesto />
      <FinalCta />
    </div>
  );
}
