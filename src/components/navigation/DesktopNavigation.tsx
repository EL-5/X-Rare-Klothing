import { useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { primaryNav } from '@/config/navigation';
import { useOutsideClick } from '@/hooks/useOutsideClick';
import { cn } from '@/lib/cn';
import { MegaMenu } from './MegaMenu';

/**
 * Desktop-only inline nav (rendered ≥1068px, see docs/responsive-map.md).
 * The flyout opens on hover *or* click (chevron), closes on outside click,
 * Escape, or Tab-away, and supports roving arrow-key navigation once open
 * (see docs/interaction-map.md — "hover vs click trigger" was left
 * ambiguous by the reference audit, so this implementation supports both).
 */
export function DesktopNavigation() {
  const [openLabel, setOpenLabel] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const close = () => setOpenLabel(null);

  useOutsideClick([navRef], close, openLabel !== null);

  const focusFirstMenuLink = (label: string) => {
    requestAnimationFrame(() => {
      menuRefs.current[label]?.querySelector<HTMLAnchorElement>('a')?.focus();
    });
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>, label: string) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setOpenLabel(label);
      focusFirstMenuLink(label);
    } else if (event.key === 'Escape' && openLabel === label) {
      close();
    }
  };

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>, label: string) => {
    const links = Array.from(menuRefs.current[label]?.querySelectorAll<HTMLAnchorElement>('a') ?? []);
    const currentIndex = links.indexOf(document.activeElement as HTMLAnchorElement);

    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      triggerRefs.current[label]?.focus();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      links[(currentIndex + 1) % links.length]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      links[(currentIndex - 1 + links.length) % links.length]?.focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      links[0]?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      links[links.length - 1]?.focus();
    }
  };

  return (
    <nav ref={navRef} className="relative hidden lg:block" aria-label="Primary">
      <ul className="flex items-center gap-8">
        {primaryNav.map((item) => (
          <li
            key={item.label}
            className="relative flex items-center"
            onMouseEnter={() => item.columns && setOpenLabel(item.label)}
            onMouseLeave={() => item.columns && close()}
          >
            <Link
              to={item.href}
              onClick={close}
              className="text-sm font-medium uppercase tracking-wide text-header-foreground transition-opacity duration-[var(--duration-base)] hover:opacity-80"
            >
              {item.label}
            </Link>
            {item.columns ? (
              <button
                ref={(el) => {
                  triggerRefs.current[item.label] = el;
                }}
                type="button"
                aria-haspopup="menu"
                aria-expanded={openLabel === item.label}
                aria-label={`${item.label} menu`}
                onClick={() => setOpenLabel(openLabel === item.label ? null : item.label)}
                onKeyDown={(event) => handleTriggerKeyDown(event, item.label)}
                className="ml-1 text-header-foreground"
              >
                <ChevronDown
                  className={cn('h-3.5 w-3.5 transition-transform duration-[var(--duration-base)]', openLabel === item.label ? 'rotate-180' : null)}
                />
              </button>
            ) : null}
            <AnimatePresence>
              {item.columns && openLabel === item.label ? (
                <MegaMenu
                  ref={(el) => {
                    menuRefs.current[item.label] = el;
                  }}
                  columns={item.columns}
                  onLinkClick={close}
                  onKeyDown={(event) => handleMenuKeyDown(event, item.label)}
                />
              ) : null}
            </AnimatePresence>
          </li>
        ))}
      </ul>
    </nav>
  );
}
