import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '@/stores/ToastStore';
import type { ToastVariant } from '@/stores/ToastStore';
import { cn } from '@/lib/cn';

const variantClassNames: Record<ToastVariant, string> = {
  default: 'bg-slate-900 text-white',
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
};

/** Admin's own toast renderer — shares the storefront's ToastStore state/logic, but styled for the admin UI so it doesn't read as storefront chrome. */
export function AdminToaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            role="status"
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.15 }}
            className={cn('pointer-events-auto rounded-lg px-4 py-3 shadow-lg', variantClassNames[toast.variant])}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{toast.title}</p>
                {toast.description ? <p className="mt-0.5 text-xs opacity-90">{toast.description}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="text-sm opacity-70 hover:opacity-100"
              >
                ×
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
