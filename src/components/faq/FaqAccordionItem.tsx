import { useId } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Faq } from '@/types/domain';

export interface FaqAccordionItemProps {
  faq: Faq;
  isOpen: boolean;
  onToggle: () => void;
}

/** A single FAQ row — real <button>, explicit aria-expanded/aria-controls, plus/minus rotation, deep-linkable by id={faq.slug}. */
export function FaqAccordionItem({ faq, isOpen, onToggle }: FaqAccordionItemProps) {
  const panelId = useId();
  const prefersReducedMotion = useReducedMotion();

  return (
    <div id={faq.slug} className="scroll-mt-32 border-b border-border">
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={panelId}
          className="flex w-full items-center justify-between gap-4 py-5 text-left text-base font-medium text-ink transition-colors duration-[var(--duration-base)] hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-lg"
        >
          <span className="uppercase tracking-wide">{faq.question}</span>
          <Plus
            className={cn('h-5 w-5 shrink-0 text-ink/50 transition-transform duration-[var(--duration-base)]', isOpen ? 'rotate-45' : null)}
            aria-hidden="true"
          />
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            id={panelId}
            role="region"
            initial={prefersReducedMotion ? undefined : { height: 0, opacity: 0 }}
            animate={prefersReducedMotion ? undefined : { height: 'auto', opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-6 max-w-2xl text-sm leading-relaxed text-ink/70">{faq.answer}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
