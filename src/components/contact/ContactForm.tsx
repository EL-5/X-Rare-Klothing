import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { contactImages, unsplashUrl } from '@/data/images';
import { contactService, type ContactValidationErrors } from '@/services/contactService';
import { ROUTES } from '@/config/routes';
import { Reveal } from '@/components/about/Reveal';
import type { ContactSubject, ContactSubmissionInput } from '@/types/domain';

const SUBJECT_OPTIONS: { value: ContactSubject; label: string }[] = [
  { value: 'general_question', label: 'General Question' },
  { value: 'order_support', label: 'Order Support' },
  { value: 'product_question', label: 'Product Question' },
  { value: 'returns_exchanges', label: 'Returns & Exchanges' },
  { value: 'wholesale', label: 'Wholesale' },
  { value: 'collaboration', label: 'Collaboration' },
  { value: 'press', label: 'Press' },
  { value: 'other', label: 'Other' },
];

const EMPTY_FORM: ContactSubmissionInput = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  subject: 'general_question',
  orderNumber: '',
  message: '',
};

export interface ContactFormProps {
  presetSubject: ContactSubject | null;
}

/** 04 — the form itself: editorial image + heading on the left, fields on the right (stacked on mobile). */
export function ContactForm({ presetSubject }: ContactFormProps) {
  const [form, setForm] = useState<ContactSubmissionInput>(EMPTY_FORM);
  const [errors, setErrors] = useState<ContactValidationErrors>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (presetSubject) setForm((f) => ({ ...f, subject: presetSubject }));
  }, [presetSubject]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = contactService.validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setStatus('submitting');
    setSubmitError(null);
    try {
      await contactService.submit(form);
      setStatus('success');
    } catch {
      setStatus('error');
      setSubmitError('Something went wrong sending your message. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <section id="contact-form" className="mx-auto max-w-xl px-6 py-24 text-center lg:py-32">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Thank you.</p>
          <h2 className="mt-4 text-3xl font-semibold uppercase tracking-tight text-ink sm:text-4xl">Message received.</h2>
          <p className="mt-4 text-sm leading-relaxed text-ink/60">We'll get back to you as soon as possible.</p>
          <Link
            to={ROUTES.home}
            className="mt-8 inline-flex h-12 items-center justify-center rounded-[var(--radius-button)] bg-ink px-8 text-xs font-semibold uppercase tracking-[var(--tracking-button)] text-surface transition-colors duration-[var(--duration-base)] hover:bg-ink/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Return to Store
          </Link>
        </Reveal>
      </section>
    );
  }

  return (
    <section id="contact-form" className="bg-surface-muted">
      <div className="mx-auto grid max-w-[var(--container-max)] grid-cols-1 lg:grid-cols-2">
        <Reveal className="relative hidden min-h-[420px] lg:block">
          <OptimizedImage
            src={unsplashUrl(contactImages.formSide.id, { w: 1200, h: 1500 })}
            alt={contactImages.formSide.alt}
            width={1200}
            height={1500}
            containerClassName="h-full w-full"
          />
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink/70 via-transparent p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Send a message</p>
            <h2 className="mt-3 max-w-xs text-3xl font-semibold uppercase leading-tight text-surface">We read every message.</h2>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="px-6 py-16 lg:px-16 lg:py-20">
          <h2 className="text-2xl font-semibold uppercase tracking-tight text-ink lg:hidden">Send a message</h2>
          <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-5 lg:mt-0">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Input
                label="First Name"
                required
                autoComplete="given-name"
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                error={errors.firstName}
              />
              <Input
                label="Last Name"
                required
                autoComplete="family-name"
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                error={errors.lastName}
              />
            </div>

            <Input
              type="email"
              label="Email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              error={errors.email}
            />

            <Input
              type="tel"
              label="Phone (optional)"
              autoComplete="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />

            <Select
              label="Subject"
              required
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value as ContactSubject }))}
              options={SUBJECT_OPTIONS}
            />

            <Input
              label="Order Number (optional)"
              value={form.orderNumber}
              onChange={(e) => setForm((f) => ({ ...f, orderNumber: e.target.value }))}
              placeholder="XR-100000"
            />

            <Textarea
              label="Message"
              required
              rows={5}
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              error={errors.message}
            />

            {submitError ? (
              <p role="alert" className="text-sm text-danger">
                {submitError}
              </p>
            ) : null}

            <Button type="submit" size="lg" isLoading={status === 'submitting'} className="mt-2">
              {status === 'submitting' ? 'Sending…' : 'Send Message'}
            </Button>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
