import { useSyncExternalStore } from 'react';

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** True once the viewport reaches the reference site's desktop-nav breakpoint (1068px). */
export function useIsDesktopNav(): boolean {
  return useMediaQuery('(min-width: 1068px)');
}
