import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthCard } from '@/components/auth/AuthCard';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { customerService } from '@/services/customerService';
import { ROUTES } from '@/config/routes';

export function Register() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptsMarketing, setAcceptsMarketing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { requiresEmailConfirmation } = await customerService.register({
        email,
        password,
        firstName: firstName || undefined,
        acceptsMarketing,
      });

      if (requiresEmailConfirmation) {
        setAwaitingConfirmation(true);
      } else {
        navigate(ROUTES.account, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create your account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (awaitingConfirmation) {
    return (
      <AuthCard title="Check your email" subtitle={`We sent a confirmation link to ${email}.`}>
        <p className="text-sm text-ink/70">
          Click the link in that email to verify your address and finish creating your account.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create Account"
      subtitle="Join for early access to drops and order tracking."
      footer={
        <p>
          Already have an account?{' '}
          <Link to={ROUTES.login} className="text-ink underline-offset-2 hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          type="text"
          label="First name"
          autoComplete="given-name"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
        />
        <Input
          type="email"
          label="Email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Input
          type="password"
          label="Password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <label className="flex items-start gap-2 text-sm text-ink/70">
          <input
            type="checkbox"
            checked={acceptsMarketing}
            onChange={(event) => setAcceptsMarketing(event.target.checked)}
            className="mt-0.5"
          />
          Email me about new arrivals and offers.
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" size="lg" isLoading={isSubmitting}>
          Create Account
        </Button>
      </form>
    </AuthCard>
  );
}
