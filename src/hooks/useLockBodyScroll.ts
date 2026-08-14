import { useEffect } from 'react';

/** Locks page scroll while a drawer/modal is open — mirrors the reference's `open-cc` body-class pattern. */
export function useLockBodyScroll(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [locked]);
}
