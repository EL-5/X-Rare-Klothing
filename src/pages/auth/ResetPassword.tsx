import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthCard } from '@/components/auth/AuthCard';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { customerService } from '@/services/customerService';
import { useAuth } from '@/stores/AuthStore';
import { ROUTES } from '@/config/routes';

/**
 * Landing page for the "reset password" email link. Supabase's client
 * automatically exchanges the link's token for a temporary recovery
 * session on load (`detectSessionInUrl`, default true) — this page just
 * waits for that, then lets the shopper set a new password.
 */
export function ResetPassword() {
  const navigate = useNavigate();
  const { session, isLoading } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await customerService.updatePassword(password);
      navigate(ROUTES.account, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset your password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <AuthCard title="Reset Password">
      <p className="text-sm text-ink/60">Loading…</p>
    </AuthCard>;
  }

  if (!session) {
    return (
      <AuthCard title="Reset link expired" subtitle="This password reset link is invalid or has expired.">
        <p className="text-sm text-ink/70">Request a new one from the sign-in page.</p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Reset Password" subtitle="Choose a new password for your account.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          type="password"
          label="New password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" size="lg" isLoading={isSubmitting}>
          Update password
        </Button>
      </form>
    </AuthCard>
  );
}
