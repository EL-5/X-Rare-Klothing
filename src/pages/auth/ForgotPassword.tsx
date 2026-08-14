import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthCard } from '@/components/auth/AuthCard';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { customerService } from '@/services/customerService';
import { ROUTES } from '@/config/routes';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await customerService.requestPasswordReset(email);
      // Always show the same success state regardless of whether the email
      // is registered — don't let this form be used to enumerate accounts.
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sent) {
    return (
      <AuthCard title="Check your email" subtitle={`If an account exists for ${email}, a reset link is on its way.`}>
        <Link to={ROUTES.login} className="text-sm text-ink underline-offset-2 hover:underline">
          Back to sign in
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Forgot Password"
      subtitle="We'll email you a link to reset it."
      footer={
        <Link to={ROUTES.login} className="text-ink underline-offset-2 hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          type="email"
          label="Email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" size="lg" isLoading={isSubmitting}>
          Send reset link
        </Button>
      </form>
    </AuthCard>
  );
}
