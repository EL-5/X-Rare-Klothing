import { useEffect } from 'react';
import type { RefObject } from 'react';

/** Fires `onOutside` for pointerdown events outside every given ref — used to dismiss the mega menu, popovers, etc. */
export function useOutsideClick(refs: RefObject<HTMLElement | null>[], onOutside: () => void, enabled = true): void {
  useEffect(() => {
    if (!enabled) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (refs.every((ref) => ref.current && !ref.current.contains(target))) {
        onOutside();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [refs, onOutside, enabled]);
}
