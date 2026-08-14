import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { primaryNav } from '@/config/navigation';
import type { NavItem } from '@/config/navigation';
import { motionTokens } from '@/lib/tokens';

export interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Off-canvas nav (<1068px). Uses the reference's drill-in pattern: tapping a
 * section with sub-links slides to a submenu screen with a back control,
 * rather than expanding inline (see docs/interaction-map.md).
 */
export function MobileNavigation({ isOpen, onClose }: MobileNavigationProps) {
  const [activeItem, setActiveItem] = useState<NavItem | null>(null);

  const handleClose = () => {
    onClose();
    setActiveItem(null);
  };

  return (
    <Drawer isOpen={isOpen} onClose={handleClose} side="left" title="Menu" className="max-w-xs">
      <nav aria-label="Mobile primary" className="relative h-full overflow-hidden">
        <AnimatePresence initial={false} mode="wait">
          {!activeItem ? (
            <motion.ul
              key="root"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: motionTokens.duration.base, ease: motionTokens.ease.standard }}
              className="flex flex-col gap-1 p-6"
            >
              {primaryNav.map((item) => (
                <li key={item.label}>
                  {item.columns ? (
                    <button
                      type="button"
                      onClick={() => setActiveItem(item)}
                      className="flex w-full items-center justify-between py-3 text-sm font-medium uppercase tracking-wide text-ink"
                    >
                      {item.label}
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  ) : (
                    <Link
                      to={item.href}
                      onClick={handleClose}
                      className="block py-3 text-sm font-medium uppercase tracking-wide text-ink"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </motion.ul>
          ) : (
            <motion.div
              key="submenu"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: motionTokens.duration.base, ease: motionTokens.ease.standard }}
              className="flex flex-col gap-1 p-6"
            >
              <button
                type="button"
                onClick={() => setActiveItem(null)}
                className="mb-4 flex items-center gap-2 text-sm text-ink/60"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Back
              </button>
              {activeItem.columns?.map((column) => (
                <div key={column.heading.label} className="mb-4">
                  <Link
                    to={column.heading.href}
                    onClick={handleClose}
                    className="block py-2 text-sm font-semibold uppercase tracking-wide text-ink"
                  >
                    {column.heading.label}
                  </Link>
                  {column.links.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={handleClose}
                      className="block py-2 pl-3 text-sm text-ink/70"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </Drawer>
  );
}
