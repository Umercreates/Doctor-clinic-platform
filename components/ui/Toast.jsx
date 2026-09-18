"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const ToastContext = createContext(null);
const DEFAULT_DURATION = 4500;

const tones = {
  success: { icon: CheckCircle2, className: "border-emerald-200 bg-white text-emerald-900", iconClass: "text-emerald-600" },
  error: { icon: XCircle, className: "border-rose-200 bg-white text-rose-900", iconClass: "text-rose-600" },
  info: { icon: Info, className: "border-brand-200 bg-white text-brand-900", iconClass: "text-brand-600" },
};

/**
 * Lightweight toast notifications for dashboard actions.
 * Usage: const toast = useToast(); toast.success("Saved");
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (tone, message, { duration = DEFAULT_DURATION } = {}) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((list) => [...list.slice(-3), { id, tone, message }]);
      if (duration > 0) window.setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss],
  );

  const api = useMemo(
    () => ({
      success: (message, options) => push("success", message, options),
      error: (message, options) => push("error", message, { duration: 7000, ...options }),
      info: (message, options) => push("info", message, options),
      dismiss,
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        role="status"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[70] flex flex-col items-end gap-2 sm:inset-x-auto sm:bottom-6 sm:right-6"
      >
        {toasts.map((toast) => {
          const meta = tones[toast.tone] || tones.info;
          return (
            <div
              key={toast.id}
              className={cn(
                "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border p-4 text-sm shadow-lift animate-slide-up",
                meta.className,
              )}
            >
              <meta.icon className={cn("mt-0.5 h-5 w-5 shrink-0", meta.iconClass)} aria-hidden="true" />
              <p className="flex-1 leading-relaxed">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
}
