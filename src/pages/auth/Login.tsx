import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthCard } from '@/components/auth/AuthCard';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { customerService } from '@/services/customerService';
import { roleRepository } from '@/repositories/roleRepository';
import { ROUTES } from '@/config/routes';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const explicitRedirect = (location.state as { from?: Location } | null)?.from?.pathname;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await customerService.signIn(email, password);
      // No explicit `from` means this wasn't a route guard sending the user
      // here — they landed on /login directly. Defaulting that case to
      // /account sent staff into the customer area with no way back out
      // (the customer UI has no admin link anywhere), so check roles
      // directly here rather than trust AuthStore's reactive `roles` state,
      // which is updated by a separate async onAuthStateChange callback and
      // isn't guaranteed to have caught up yet at this exact moment.
      let redirectTo = explicitRedirect ?? ROUTES.account;
      if (!explicitRedirect) {
        const roles = await roleRepository.getMyRoles();
        if (roles.length > 0) redirectTo = ROUTES.admin;
      }
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Sign In"
      subtitle="Welcome back."
      footer={
        <>
          <p>
            New here?{' '}
            <Link to={ROUTES.register} className="text-ink underline-offset-2 hover:underline">
              Create an account
            </Link>
          </p>
          <p className="mt-1">
            <Link to={ROUTES.forgotPassword} className="text-ink underline-offset-2 hover:underline">
              Forgot your password?
            </Link>
          </p>
        </>
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
        <Input
          type="password"
          label="Password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" size="lg" isLoading={isSubmitting}>
          Sign In
        </Button>
      </form>
    </AuthCard>
  );
}
