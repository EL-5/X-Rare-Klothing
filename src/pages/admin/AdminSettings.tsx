import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminCard, AdminCardHeader, AdminCardBody } from '@/components/admin/ui/AdminCard';
import { AdminInput, AdminSelect } from '@/components/admin/ui/AdminInput';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { useToast } from '@/stores/ToastStore';
import { settingsService } from '@/services/settingsService';

interface SettingsForm {
  store_name: string;
  support_email: string;
  currency: string;
  order_prefix: string;
  low_stock_default_threshold: string;
  free_shipping_threshold_cents: string;
  announcement_enabled: boolean;
  announcement_message: string;
  footer_tagline: string;
}

const DEFAULTS: SettingsForm = {
  store_name: 'X-Rare',
  support_email: '',
  currency: 'USD',
  order_prefix: 'XR',
  low_stock_default_threshold: '5',
  free_shipping_threshold_cents: '15000',
  announcement_enabled: true,
  announcement_message: 'Free shipping on orders over $200',
  footer_tagline: 'Rare by design. Different by nature.',
};

export function AdminSettings() {
  const { show } = useToast();
  const [form, setForm] = useState<SettingsForm | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    settingsService.getAll().then((values) => {
      setForm({
        store_name: String(values.store_name ?? DEFAULTS.store_name),
        support_email: String(values.support_email ?? DEFAULTS.support_email),
        currency: String(values.currency ?? DEFAULTS.currency),
        order_prefix: String(values.order_prefix ?? DEFAULTS.order_prefix),
        low_stock_default_threshold: String(values.low_stock_default_threshold ?? DEFAULTS.low_stock_default_threshold),
        free_shipping_threshold_cents: String(values.free_shipping_threshold_cents ?? DEFAULTS.free_shipping_threshold_cents),
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
            <AdminInput label="Store name" value={form.store_name} onChange={(e) => setForm({ ...form, store_name: e.target.value })} />
            <AdminInput label="Support email" type="email" value={form.support_email} onChange={(e) => setForm({ ...form, support_email: e.target.value })} />
            <AdminSelect
              label="Currency"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              options={[
                { value: 'USD', label: 'USD ($)' },
                { value: 'NGN', label: 'NGN (₦)' },
                { value: 'GHS', label: 'GHS (₵)' },
              ]}
            />
            <AdminInput label="Order number prefix" value={form.order_prefix} onChange={(e) => setForm({ ...form, order_prefix: e.target.value })} />
          </AdminCardBody>
        </AdminCard>

        <AdminCard className="mt-6">
          <AdminCardHeader>
            <h2 className="text-sm font-semibold text-slate-900">Inventory & shipping</h2>
          </AdminCardHeader>
          <AdminCardBody className="grid gap-4 sm:grid-cols-2">
            <AdminInput
              label="Default low-stock threshold"
              type="number"
              value={form.low_stock_default_threshold}
              onChange={(e) => setForm({ ...form, low_stock_default_threshold: e.target.value })}
            />
            <AdminInput
              label="Free shipping threshold (cents)"
              type="number"
              value={form.free_shipping_threshold_cents}
              onChange={(e) => setForm({ ...form, free_shipping_threshold_cents: e.target.value })}
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
