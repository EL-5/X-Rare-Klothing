import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/stores/AuthStore';
import { customerService } from '@/services/customerService';
import { useToast } from '@/stores/ToastStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AccountPageHeader } from '@/components/account/AccountPageHeader';
import { ROUTES } from '@/config/routes';

export function Settings() {
  const { profile, refreshProfile } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();

  const [acceptsMarketing, setAcceptsMarketing] = useState(profile?.acceptsMarketing ?? false);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const handlePrefsSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile) return;
    setIsSavingPrefs(true);
    try {
      await customerService.update(profile.id, { acceptsMarketing });
      await refreshProfile();
      show({ title: 'Preferences saved', variant: 'success' });
    } catch (err) {
      show({ title: 'Could not save preferences', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newPassword.length < 8) {
      show({ title: 'Password must be at least 8 characters.', variant: 'error' });
      return;
    }
    setIsSavingPassword(true);
    try {
      await customerService.updatePassword(newPassword);
      setNewPassword('');
      show({ title: 'Password updated', variant: 'success' });
    } catch (err) {
      show({ title: 'Could not update password', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleSignOut = async () => {
    await customerService.signOut();
    navigate(ROUTES.home, { replace: true });
  };

  return (
    <div className="flex flex-col gap-10">
      <AccountPageHeader title="Settings" description="Password, email preferences, sign out." />

      <form onSubmit={handlePrefsSubmit} className="max-w-md">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">Email preferences</h2>
        <label className="mt-3 flex items-center gap-2 text-sm text-ink/70">
          <input type="checkbox" checked={acceptsMarketing} onChange={(e) => setAcceptsMarketing(e.target.checked)} />
          Email me about new arrivals and offers.
        </label>
        <Button type="submit" size="sm" variant="outline" className="mt-3" isLoading={isSavingPrefs}>
          Save
        </Button>
      </form>

      <form onSubmit={handlePasswordSubmit} className="max-w-md">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">Change password</h2>
        <Input
          type="password"
          label="New password"
          minLength={8}
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          containerClassName="mt-3"
        />
        <Button type="submit" size="sm" variant="outline" className="mt-3" isLoading={isSavingPassword}>
          Update password
        </Button>
      </form>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">Session</h2>
        <Button type="button" size="sm" variant="ghost" className="mt-3" onClick={handleSignOut}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
