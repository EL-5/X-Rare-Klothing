import { useState } from 'react';
import type { FormEvent } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/stores/ToastStore';
import { newsletterRepository } from '@/repositories/newsletterRepository';
import { analyticsService } from '@/services/analyticsService';

export interface NewsletterProps {
  heading?: string;
  incentive?: string;
}

/** Name + email signup — mirrors the reference footer's newsletter form (see docs/interaction-map.md). */
export function Newsletter({
  heading = 'Join the list',
  incentive = 'Get 10% off your next order.',
}: NewsletterProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { show } = useToast();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await newsletterRepository.subscribe(email, name.trim() || undefined);
      void analyticsService.trackNewsletterSignup();
      show({ title: 'You’re on the list', description: 'Check your inbox for your discount code.', variant: 'success' });
      setName('');
      setEmail('');
    } catch (err) {
      show({ title: 'Could not sign you up', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide">{heading}</h3>
      <p className="mt-1 text-xs text-footer-foreground/70">{incentive}</p>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="bg-transparent text-footer-foreground placeholder:text-footer-foreground/50"
        />
        <Input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="bg-transparent text-footer-foreground placeholder:text-footer-foreground/50"
        />
        <Button type="submit" variant="outline" isLoading={isSubmitting} className="shrink-0 border-footer-foreground text-footer-foreground hover:bg-footer-foreground hover:text-footer">
          Sign up
        </Button>
      </form>
    </div>
  );
}
