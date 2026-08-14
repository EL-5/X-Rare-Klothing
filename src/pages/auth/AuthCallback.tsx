import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthCard } from '@/components/auth/AuthCard';
import { useAuth } from '@/stores/AuthStore';
import { ROUTES } from '@/config/routes';

/**
 * Landing page for email-confirmation links (`emailRedirectTo` in
 * customerService.register/resendVerificationEmail). supabase-js parses the
 * token out of the URL and establishes a session automatically; this page
 * just waits for AuthStore to observe it, then redirects.
 */
export function AuthCallback() {
  const navigate = useNavigate();
  const { session, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const errorDescription = searchParams.get('error_description');

  useEffect(() => {
    if (!isLoading && session && !errorDescription) {
      navigate(ROUTES.account, { replace: true });
    }
  }, [isLoading, session, errorDescription, navigate]);

  if (errorDescription) {
    return (
      <AuthCard title="Verification failed" subtitle={errorDescription}>
        <p className="text-sm text-ink/70">The link may have expired — try signing in and requesting a new one.</p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Verifying…">
      <p className="text-sm text-ink/60">Confirming your account, one moment.</p>
    </AuthCard>
  );
}
