import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminCard, AdminCardHeader, AdminCardBody } from '@/components/admin/ui/AdminCard';
import { AdminInput } from '@/components/admin/ui/AdminInput';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { useToast } from '@/stores/ToastStore';
import { settingsService } from '@/services/settingsService';

interface SettingsForm {
  support_email: string;
  announcement_enabled: boolean;
  announcement_message: string;
  footer_tagline: string;
}

const DEFAULTS: SettingsForm = {
  support_email: '',
  announcement_enabled: true,
  announcement_message: 'Free shipping on orders over $200',
  footer_tagline: 'Rare by design. Different by nature.',
};

// Only these four settings keys are actually read anywhere in the app
// (Contact.tsx reads support_email, Header.tsx reads the two announcement_
// keys, Footer.tsx reads footer_tagline). This page used to also offer
// store_name, currency, order_prefix, low_stock_default_threshold, and
// free_shipping_threshold_cents — all of them wrote to the settings table
// but nothing ever read them back; the real values are hardcoded elsewhere
// (site name in useDocumentHead.ts, currency/order-number-prefix as DB
// column defaults, per-variant low-stock threshold as a DB column default,
// shipping rules in the real shipping_zones/shipping_methods tables). An
// admin editing those fields and clicking Save would see "Settings saved"
// and reasonably believe they'd changed something that, in fact, never
// changed at all. Removed rather than wired up, since making them real
// would mean refactoring the currency/order-numbering/inventory/shipping
// logic itself — a much larger change than this settings page owns.
export function AdminSettings() {
  const { show } = useToast();
  const [form, setForm] = useState<SettingsForm | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    settingsService.getAll().then((values) => {
      setForm({
        support_email: String(values.support_email ?? DEFAULTS.support_email),
        announcement_enabled: typeof values.announcement_enabled === 'boolean' ? values.announcement_enabled : DEFAULTS.announcement_enabled,
        announcement_message: String(values.announcement_message ?? DEFAULTS.announcement_message),
        footer_tagline: String(values.footer_tagline ?? DEFAULTS.footer_tagline),
      });
    });
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form) return;
    setIsSaving(true);
    try {
      await Promise.all(Object.entries(form).map(([key, value]) => settingsService.set(key, value)));
      show({ title: 'Settings saved', variant: 'success' });
    } catch (err) {
      show({ title: 'Could not save settings', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!form) {
    return <AdminSkeleton className="h-96 w-full" />;
  }

  return (
    <div>
      <AdminPageHeader title="Settings" description="Store-wide configuration. Restricted to admin and super_admin — both at this route and at the database level." />

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <AdminCard>
          <AdminCardHeader>
            <h2 className="text-sm font-semibold text-slate-900">General</h2>
          </AdminCardHeader>
          <AdminCardBody className="grid gap-4 sm:grid-cols-2">
            <AdminInput
              containerClassName="sm:col-span-2"
              label="Support email"
              type="email"
              value={form.support_email}
              onChange={(e) => setForm({ ...form, support_email: e.target.value })}
            />
          </AdminCardBody>
        </AdminCard>

        <AdminCard className="mt-6">
          <AdminCardHeader>
            <h2 className="text-sm font-semibold text-slate-900">Storefront content</h2>
          </AdminCardHeader>
          <AdminCardBody className="grid gap-4 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.announcement_enabled}
                onChange={(e) => setForm({ ...form, announcement_enabled: e.target.checked })}
              />
              Show announcement bar
            </label>
            <AdminInput
              label="Announcement message"
              containerClassName="sm:col-span-2"
              value={form.announcement_message}
              onChange={(e) => setForm({ ...form, announcement_message: e.target.value })}
            />
            <AdminInput
              label="Footer tagline"
              containerClassName="sm:col-span-2"
              value={form.footer_tagline}
              onChange={(e) => setForm({ ...form, footer_tagline: e.target.value })}
            />
          </AdminCardBody>
        </AdminCard>

        <AdminButton type="submit" isLoading={isSaving} className="mt-6">
          Save settings
        </AdminButton>
      </form>
    </div>
  );
}
