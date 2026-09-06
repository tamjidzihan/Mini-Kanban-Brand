import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../lib/cn';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  description?: string;
  duration?: number;
  action?: ToastAction;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  action?: ToastAction;
}

interface ToastContextValue {
  success: (title: string, options?: ToastOptions) => void;
  error: (title: string, options?: ToastOptions) => void;
  info: (title: string, options?: ToastOptions) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, title: string, options?: ToastOptions) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = {
        id,
        type,
        title,
        description: options?.description,
        action: options?.action,
      };

      setToasts((prev) => {
        // Keep max 4 toasts
        const next = [...prev, newToast];
        if (next.length > 4) {
          return next.slice(next.length - 4);
        }
        return next;
      });

      const duration = options?.duration ?? (type === 'error' ? 5000 : 3500);
      setTimeout(() => {
        dismiss(id);
      }, duration);
    },
    [dismiss]
  );

  const success = useCallback(
    (title: string, options?: ToastOptions) => addToast('success', title, options),
    [addToast]
  );
  const error = useCallback(
    (title: string, options?: ToastOptions) => addToast('error', title, options),
    [addToast]
  );
  const info = useCallback(
    (title: string, options?: ToastOptions) => addToast('info', title, options),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ success, error, info, dismiss }}>
      {children}

      {/* Fixed Toast Viewport per §14.24 */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => {
          const accentColor =
            t.type === 'success'
              ? 'bg-emerald-500'
              : t.type === 'error'
              ? 'bg-rose-500'
              : 'bg-sky-500';

          const icon =
            t.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : t.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
            );

          return (
            <div
              key={t.id}
              className={cn(
                'pointer-events-auto relative overflow-hidden flex items-start gap-3 p-3.5 rounded-xl border',
                'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-dropdown border-gray-200/80 dark:border-gray-800',
                'transition-all duration-200 transform translate-y-0 opacity-100'
              )}
            >
              {/* Left Accent Bar */}
              <div className={cn('absolute left-0 top-0 bottom-0 w-1', accentColor)} />

              <div className="pt-0.5">{icon}</div>

              <div className="flex-1 min-w-0 pr-1">
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {t.title}
                </div>
                {t.description && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    {t.description}
                  </div>
                )}
                {t.action && (
                  <button
                    type="button"
                    onClick={() => {
                      t.action?.onClick();
                      dismiss(t.id);
                    }}
                    className="mt-1.5 inline-flex items-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    {t.action.label}
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5 rounded-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
