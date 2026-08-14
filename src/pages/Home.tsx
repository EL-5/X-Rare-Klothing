import { useEffect, useState } from 'react';
import { HomeSectionRenderer } from '@/components/home/HomeSectionRenderer';
import { homepageSectionService } from '@/services/homepageSectionService';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDocumentHead } from '@/hooks/useDocumentHead';
import type { HomepageSection } from '@/types/domain';

/** Renders whatever's configured in the admin Homepage Builder, in order — see Batch 16. Footer's own Newsletter renders globally in RootLayout, so it isn't repeated here. */
export function Home() {
  const [sections, setSections] = useState<HomepageSection[] | null>(null);

  useDocumentHead({
    title: 'X-Rare',
    description: 'X-Rare — rare by design, different by nature. Shop new arrivals, collections, and accessories.',
    path: '/',
  });

  useEffect(() => {
    homepageSectionService.listEnabled().then(setSections);
  }, []);

  if (sections === null) {
    return <Skeleton className="h-[500px] w-full lg:h-[680px]" />;
  }

  return (
    <div>
      {sections.map((section) => (
        <HomeSectionRenderer key={section.id} section={section} />
      ))}
    </div>
  );
}
