import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';
import { motionTokens } from '@/lib/tokens';
import { cn } from '@/lib/cn';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  side?: 'left' | 'right';
  title?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Generic slide-out panel — the single primitive backing CartDrawer,
 * SearchDrawer, MobileNavigation, and Quick View, mirroring how the
 * reference site reuses one `.side-panel` component for all of those
 * (see docs/component-inventory.md).
 */
export function Drawer({ isOpen, onClose, side = 'right', title, children, className }: DrawerProps) {
  useLockBodyScroll(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: motionTokens.duration.base }}
            className="absolute inset-0 bg-ink/40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: side === 'right' ? '100%' : '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: side === 'right' ? '100%' : '-100%' }}
            transition={{ duration: motionTokens.duration.base, ease: motionTokens.ease.standard }}
            className={cn(
              'absolute top-0 flex h-full w-full max-w-md flex-col bg-surface shadow-[var(--shadow-drawer)]',
              side === 'right' ? 'right-0' : 'left-0',
              className,
            )}
          >
            {title ? (
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide">{title}</h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="text-ink/60 transition-colors hover:text-ink"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : null}
            <div className="flex-1 overflow-y-auto">{children}</div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
