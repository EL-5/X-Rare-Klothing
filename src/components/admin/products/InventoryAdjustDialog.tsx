import { useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminInput, AdminSelect, AdminTextarea } from '@/components/admin/ui/AdminInput';

export type AdjustType = 'restock' | 'return' | 'adjustment';

export interface InventoryAdjustDialogProps {
  isOpen: boolean;
  productName: string;
  variantSku: string;
  onSubmit: (type: AdjustType, quantity: number, reason: string) => Promise<void>;
  onCancel: () => void;
}

const TYPE_OPTIONS: { value: AdjustType; label: string }[] = [
  { value: 'restock', label: 'Restock (add stock)' },
  { value: 'return', label: 'Customer return (add stock)' },
  { value: 'adjustment', label: 'Correction (add or remove — use a negative quantity to remove)' },
];

export function InventoryAdjustDialog({ isOpen, productName, variantSku, onSubmit, onCancel }: InventoryAdjustDialogProps) {
  const [type, setType] = useState<AdjustType>('restock');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const parsed = Number(quantity);
    if (!Number.isFinite(parsed) || parsed === 0) return;
    setIsSubmitting(true);
    try {
      await onSubmit(type, parsed, reason);
      setQuantity('');
      setReason('');
      setType('restock');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/50" onClick={onCancel} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-sm rounded-lg bg-white p-6 shadow-xl"
          >
            <h2 className="text-base font-semibold text-slate-900">Adjust stock</h2>
            <p className="mt-1 text-sm text-slate-500">
              {productName} — <span className="font-mono text-xs">{variantSku}</span>
            </p>

            <div className="mt-4 flex flex-col gap-4">
              <AdminSelect label="Reason type" value={type} onChange={(e) => setType(e.target.value as AdjustType)} options={TYPE_OPTIONS} />
              <AdminInput
                label="Quantity"
                type="number"
                required
                placeholder={type === 'adjustment' ? 'e.g. -2 or 5' : 'e.g. 20'}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              <AdminTextarea label="Note (optional)" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <AdminButton variant="outline" size="sm" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </AdminButton>
              <AdminButton size="sm" onClick={handleSubmit} isLoading={isSubmitting} disabled={!quantity}>
                Record movement
              </AdminButton>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
