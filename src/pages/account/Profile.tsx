import { useState } from 'react';
import type { FormEvent } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/stores/AuthStore';
import { customerService } from '@/services/customerService';
import { useToast } from '@/stores/ToastStore';

export function Profile() {
  const { profile, refreshProfile } = useAuth();
  const { show } = useToast();
  const [firstName, setFirstName] = useState(profile?.firstName ?? '');
  const [lastName, setLastName] = useState(profile?.lastName ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile) return;
    setIsSubmitting(true);
    try {
      await customerService.update(profile.id, { firstName, lastName, phone });
      await refreshProfile();
      show({ title: 'Profile updated', variant: 'success' });
    } catch (err) {
      show({ title: 'Could not update profile', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-semibold uppercase tracking-wide text-ink">Profile</h1>
      <form onSubmit={handleSubmit} className="mt-6 flex max-w-md flex-col gap-4">
        <Input label="Email" value={profile?.email ?? ''} disabled />
        <Input label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        <Input label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        <Input label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Button type="submit" isLoading={isSubmitting} className="self-start">
          Save changes
        </Button>
      </form>
    </div>
  );
}
