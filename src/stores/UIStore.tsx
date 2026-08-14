import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useDisclosure, type Disclosure } from '@/hooks/useDisclosure';

interface UIStoreValue {
  cartDrawer: Disclosure;
  searchDrawer: Disclosure;
  mobileNav: Disclosure;
}

const UIContext = createContext<UIStoreValue | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const cartDrawer = useDisclosure();
  const searchDrawer = useDisclosure();
  const mobileNav = useDisclosure();

  const value = useMemo<UIStoreValue>(
    () => ({ cartDrawer, searchDrawer, mobileNav }),
    [cartDrawer, searchDrawer, mobileNav],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUIStore(): UIStoreValue {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUIStore must be used within a UIProvider');
  }
  return context;
}
