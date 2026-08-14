import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

export interface AccordionProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

/** Native <details>/<summary> — same pattern the reference uses for PDP/FAQ accordions, keyboard toggling works for free (see docs/interaction-map.md). */
export function Accordion({ title, defaultOpen = false, children }: AccordionProps) {
  return (
    <details open={defaultOpen} className="group border-b border-border py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium uppercase tracking-wide text-ink">
        {title}
        <ChevronDown className="h-4 w-4 shrink-0 text-ink/50 transition-transform duration-[var(--duration-base)] group-open:rotate-180" />
      </summary>
      <div className="mt-3 text-sm text-ink/70">{children}</div>
    </details>
  );
}
