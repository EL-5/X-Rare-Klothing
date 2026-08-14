import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '@/stores/ToastStore';
import type { ToastVariant } from '@/stores/ToastStore';
import { cn } from '@/lib/cn';
import { motionTokens } from '@/lib/tokens';

const variantClassNames: Record<ToastVariant, string> = {
  default: 'bg-ink text-surface',
  success: 'bg-success text-surface',
  error: 'bg-danger text-surface',
};

/** Renders the live toast stack — mount once near the root, alongside ToastProvider. */
export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            role="status"
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: motionTokens.duration.base, ease: motionTokens.ease.standard }}
            className={cn(
              'pointer-events-auto rounded-[var(--radius-card)] px-4 py-3 shadow-[var(--shadow-popover)]',
              variantClassNames[toast.variant],
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description ? <p className="mt-1 text-xs opacity-90">{toast.description}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="text-sm opacity-70 transition-opacity hover:opacity-100"
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
