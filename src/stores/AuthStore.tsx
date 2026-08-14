import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { customerService } from '@/services/customerService';
import { roleRepository } from '@/repositories/roleRepository';
import type { AdminRole, Customer } from '@/types/domain';

interface AuthStoreValue {
  session: Session | null;
  profile: Customer | null;
  roles: AdminRole[];
  /** True once the initial session check has resolved — gate route guards on this, not `!session`. */
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Any admin role at all. Client-side convenience only — never the enforcement boundary (see docs/authorization.md). */
  isStaff: boolean;
  hasRole: (role: AdminRole) => boolean;
  hasAnyRole: (...roles: AdminRole[]) => boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthStoreValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Customer | null>(null);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfileAndRoles = useCallback(async (hasSession: boolean) => {
    if (!hasSession) {
      setProfile(null);
      setRoles([]);
      return;
    }
    const [nextProfile, nextRoles] = await Promise.all([
      customerService.getCurrent(),
      roleRepository.getMyRoles(),
    ]);
    setProfile(nextProfile);
    setRoles(nextRoles);
  }, []);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await loadProfileAndRoles(Boolean(data.session));
      if (active) setIsLoading(false);
    });

    // Session persistence across refresh/tabs: supabase-js restores the
    // session from localStorage on load and fires this listener with the
    // restored session — we don't do our own token storage.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      void loadProfileAndRoles(Boolean(nextSession));
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadProfileAndRoles]);

  const refreshProfile = useCallback(async () => {
    await loadProfileAndRoles(Boolean(session));
  }, [loadProfileAndRoles, session]);

  const hasRole = useCallback((role: AdminRole) => roles.includes(role), [roles]);
  const hasAnyRole = useCallback((...checked: AdminRole[]) => checked.some((r) => roles.includes(r)), [roles]);

  const value = useMemo<AuthStoreValue>(
    () => ({
      session,
      profile,
      roles,
      isLoading,
      isAuthenticated: session !== null,
      isStaff: roles.length > 0,
      hasRole,
      hasAnyRole,
      refreshProfile,
    }),
    [session, profile, roles, isLoading, hasRole, hasAnyRole, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthStoreValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
