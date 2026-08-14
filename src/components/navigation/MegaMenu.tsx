import { forwardRef } from 'react';
import type { KeyboardEventHandler } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { NavColumn } from '@/config/navigation';
import { motionTokens } from '@/lib/tokens';

export interface MegaMenuProps {
  columns: NavColumn[];
  onLinkClick?: () => void;
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
}

/** Desktop mega-menu flyout — the two-column Men/Women panel from the reference (see docs/component-inventory.md). */
export const MegaMenu = forwardRef<HTMLDivElement, MegaMenuProps>(function MegaMenu(
  { columns, onLinkClick, onKeyDown },
  ref,
) {
  return (
    <motion.div
      ref={ref}
      role="menu"
      onKeyDown={onKeyDown}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: motionTokens.duration.base, ease: motionTokens.ease.standard }}
      className="absolute left-0 top-full z-40 w-full border-t border-border bg-surface shadow-[var(--shadow-popover)]"
    >
      <div className="mx-auto grid max-w-[var(--container-max)] grid-cols-2 gap-12 px-8 py-10">
        {columns.map((column) => (
          <div key={column.heading.label}>
            <Link
              to={column.heading.href}
              role="menuitem"
              onClick={onLinkClick}
              className="text-sm font-semibold uppercase tracking-wide text-ink"
            >
              {column.heading.label}
            </Link>
            <ul className="mt-4 flex flex-col gap-3">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    role="menuitem"
                    onClick={onLinkClick}
                    className="text-sm text-ink/70 transition-colors duration-[var(--duration-fast)] hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </motion.div>
  );
});
