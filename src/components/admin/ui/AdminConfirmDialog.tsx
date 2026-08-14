import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AdminButton, type AdminButtonVariant } from './AdminButton';

export interface AdminConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  confirmVariant?: AdminButtonVariant;
  isConfirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Admin's own confirmation dialog — separate from the storefront's Modal primitive, per the batch's architecture-separation requirement. */
export function AdminConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  confirmVariant = 'danger',
  isConfirming = false,
  onConfirm,
  onCancel,
}: AdminConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="alertdialog" aria-modal="true">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/50"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-sm rounded-lg bg-white p-6 shadow-xl"
          >
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}
            <div className="mt-6 flex justify-end gap-2">
              <AdminButton variant="outline" size="sm" onClick={onCancel} disabled={isConfirming}>
                Cancel
              </AdminButton>
              <AdminButton variant={confirmVariant} size="sm" onClick={onConfirm} isLoading={isConfirming}>
                {confirmLabel}
              </AdminButton>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
