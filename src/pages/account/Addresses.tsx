import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/stores/AuthStore';
import { addressService } from '@/services/addressService';
import { useToast } from '@/stores/ToastStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { AddressInput } from '@/repositories/addressRepository';
import type { Address } from '@/types/domain';

const emptyForm: AddressInput = {
  type: 'shipping',
  isDefault: false,
  firstName: '',
  lastName: '',
  company: '',
  line1: '',
  line2: '',
  city: '',
  region: '',
  postalCode: '',
  country: '',
  phone: '',
};

export function Addresses() {
  const { profile } = useAuth();
  const { show } = useToast();
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<AddressInput>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const load = async () => {
    if (!profile) return;
    setAddresses(await addressService.listForCustomer(profile.id));
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const startEdit = (address?: Address) => {
    if (address) {
      setForm({
        type: address.type,
        isDefault: address.isDefault,
        firstName: address.firstName,
        lastName: address.lastName,
        company: address.company ?? '',
        line1: address.line1,
        line2: address.line2 ?? '',
        city: address.city,
        region: address.region ?? '',
        postalCode: address.postalCode ?? '',
        country: address.country,
        phone: address.phone ?? '',
      });
      setEditingId(address.id);
    } else {
      setForm(emptyForm);
      setEditingId('new');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile) return;
    setIsSubmitting(true);
    try {
      if (editingId && editingId !== 'new') {
        await addressService.update(editingId, form);
      } else {
        await addressService.create(profile.id, form);
      }
      setEditingId(null);
      await load();
      show({ title: 'Address saved', variant: 'success' });
    } catch (err) {
      show({ title: 'Could not save address', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await addressService.remove(id);
      await load();
    } catch (err) {
      show({ title: 'Could not remove address', description: err instanceof Error ? err.message : undefined, variant: 'error' });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold uppercase tracking-wide text-ink">Addresses</h1>
        {editingId === null ? (
          <Button size="sm" variant="outline" onClick={() => startEdit()}>
            Add address
          </Button>
        ) : null}
      </div>

      {editingId !== null ? (
        <form onSubmit={handleSubmit} className="mt-6 grid max-w-lg gap-4 border border-border p-6 sm:grid-cols-2">
          <Input label="First name" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          <Input label="Last name" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          <Input containerClassName="sm:col-span-2" label="Address line 1" required value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} />
          <Input containerClassName="sm:col-span-2" label="Address line 2" value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} />
          <Input label="City" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <Input label="Region / State" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
          <Input label="Postal code" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} />
          <Input label="Country code" required placeholder="US" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          <Input className="sm:col-span-2" label="Phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <label className="flex items-center gap-2 text-sm text-ink/70 sm:col-span-2">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
            Set as default {form.type} address
          </label>
          <div className="flex gap-3 sm:col-span-2">
            <Button type="submit" isLoading={isSubmitting}>
              Save address
            </Button>
            <Button type="button" variant="ghost" onClick={() => setEditingId(null)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {addresses === null ? null : addresses.length === 0 && editingId === null ? (
        <p className="mt-6 text-sm text-ink/60">No saved addresses yet.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {addresses.map((address, index) => (
            <motion.div
              key={address.id}
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: prefersReducedMotion ? 0 : index * 0.06 }}
              className="border border-border p-4 text-sm"
            >
              {address.isDefault ? (
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/60">Default {address.type}</p>
              ) : null}
              <p className="font-medium text-ink">
                {address.firstName} {address.lastName}
              </p>
              <p className="text-ink/70">{address.line1}</p>
              {address.line2 ? <p className="text-ink/70">{address.line2}</p> : null}
              <p className="text-ink/70">
                {address.city}
                {address.region ? `, ${address.region}` : ''} {address.postalCode}
              </p>
              <p className="text-ink/70">{address.country}</p>
              <div className="mt-3 flex gap-3">
                <button type="button" onClick={() => startEdit(address)} className="text-xs underline-offset-2 hover:underline">
                  Edit
                </button>
                <button type="button" onClick={() => handleDelete(address.id)} className="text-xs text-danger underline-offset-2 hover:underline">
                  Remove
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
