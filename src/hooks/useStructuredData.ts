import { useEffect } from 'react';

/**
 * Injects one or more `application/ld+json` script tags for the lifetime of
 * the calling component, removing them on unmount so the next route's own
 * structured data doesn't collide with a stale tag left behind.
 */
export function useStructuredData(data: object | object[] | null): void {
  useEffect(() => {
    if (!data) return;
    const items = Array.isArray(data) ? data : [data];
    const elements = items.map((item) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(item);
      document.head.appendChild(script);
      return script;
    });
    return () => {
      for (const el of elements) el.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data)]);
}
