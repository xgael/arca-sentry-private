"use client";

/**
 * Sistema de toast — adapter sobre Sileo (sileo.aaryan.design).
 *
 * Misma API que en Forbes ERP: `useToast()` + helpers
 * `toast.success/error/warning/info(title, description?)`.
 *
 * Sileo provee la UI (SVG morphing, spring physics, theme-aware, accesible).
 * El `<Toaster>` se monta una sola vez en `app/layout.tsx`.
 */

import * as React from "react";
import { sileo, Toaster, type SileoOptions, type SileoPosition } from "sileo";
import "sileo/styles.css";

// Defaults de marca ARCA SENTRY — navy sobre blanco, matchea el resto del UI.
const SENTRY_TOAST_DEFAULTS: Partial<SileoOptions> = {
  // Coincide con el border-radius de las cards del dashboard.
  roundness: 10,
  // Navy deep que ya uso en --bg-deep para drawer-head y brand-logo.
  fill: "#0b1a33",
  styles: {
    // Tailwind v4 (arca-sentry) usa el sufijo `!` (no prefijo como Forbes v3).
    title:       "text-white! text-sm! font-semibold! tracking-tight!",
    description: "text-white/70! text-xs! leading-relaxed!",
    badge:       "ring-1! ring-white/15!",
    button:      "text-black! bg-white! hover:bg-white/90!",
  },
};

export type ToastVariant = "success" | "error" | "warning" | "info";

interface ToastCallOptions {
  variant?: ToastVariant;
  title: string;
  description?: string;
}

interface PromiseToastSpec {
  title: string;
  description?: string;
}

interface PromiseToastOptions<T> {
  loading: PromiseToastSpec;
  success: PromiseToastSpec | ((data: T) => PromiseToastSpec);
  error?: PromiseToastSpec | ((err: unknown) => PromiseToastSpec);
}

interface ToastContextValue {
  toast:   (opts: ToastCallOptions) => void;
  success: (title: string, description?: string) => void;
  error:   (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info:    (title: string, description?: string) => void;
  promise: <T>(p: Promise<T>, opts: PromiseToastOptions<T>) => Promise<T>;
}

// sileo.* es singleton global — el context es estable.
const toastApi: ToastContextValue = {
  toast: ({ variant = "info", title, description }) => {
    sileo[variant]({ title, description });
  },
  success: (title, description) => sileo.success({ title, description }),
  error:   (title, description) => sileo.error({ title, description }),
  warning: (title, description) => sileo.warning({ title, description }),
  info:    (title, description) => sileo.info({ title, description }),
  promise: <T,>(p: Promise<T>, opts: PromiseToastOptions<T>) => {
    sileo.promise(p, {
      loading: { title: opts.loading.title, description: opts.loading.description },
      success: (data: T) => {
        const spec = typeof opts.success === "function" ? opts.success(data) : opts.success;
        return { title: spec.title, description: spec.description };
      },
      error: (err: unknown) => {
        const fallback: PromiseToastSpec = {
          title: "Request failed",
          description: err instanceof Error ? err.message : String(err),
        };
        const spec = opts.error
          ? (typeof opts.error === "function" ? opts.error(err) : opts.error)
          : fallback;
        return { title: spec.title, description: spec.description };
      },
    });
    return p;
  },
};

const ToastContext = React.createContext<ToastContextValue>(toastApi);

interface ToastProviderProps {
  children: React.ReactNode;
  position?: SileoPosition;
}

export function ToastProvider({
  children,
  position = "top-right",
}: ToastProviderProps) {
  return (
    <ToastContext.Provider value={toastApi}>
      {children}
      <Toaster
        position={position}
        offset={{ top: 24 }}
        options={SENTRY_TOAST_DEFAULTS}
      />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  return React.useContext(ToastContext);
}

// Acceso directo (sin hook) — útil fuera de React (axios interceptors, etc.).
export const toast = toastApi;
