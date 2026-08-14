import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Shared by every Drawer/Modal instance (Cart, Search, Quick View, Mobile
 * Nav, confirm dialogs, etc.): moves focus into the panel on open, keeps
 * Tab/Shift+Tab cycling within it while open, and returns focus to whatever
 * triggered it on close — none of which existed before (Escape-to-close and
 * role="dialog"/aria-modal were already in place, but a screen reader or
 * keyboard-only user could previously Tab straight out of an open panel
 * into the page behind it).
 */
export function useFocusTrap(containerRef: RefObject<HTMLElement | null>, isOpen: boolean): void {
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    previouslyFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const container = containerRef.current;
    // The panel is already committed to the DOM by the time this effect
    // runs (React commits refs before effects fire, portal or not), so
    // focus can move in immediately — no need to wait a frame, and
    // requestAnimationFrame can be throttled/skipped in backgrounded or
    // automated browser contexts anyway.
    if (container) {
      const focusable = container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (focusable ?? container).focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !container) return;
      const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetParent !== null,
      );
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedRef.current?.focus();
    };
  }, [isOpen, containerRef]);
}
