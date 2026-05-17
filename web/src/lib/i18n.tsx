"use client";

// ARCA SENTRY — client-side i18n context + hook.
// Replaces the legacy global `window.t()` from api/dashboard/static/i18n.js.
//
// Usage:
//   <I18nProvider>...</I18nProvider>          // wrap the app shell
//   const { t, lang, setLang } = useT();      // anywhere below
//
// SSR-safe: initial render always uses DEFAULT_LANG so the server-rendered
// HTML matches what the browser produces on first paint. The persisted lang
// (localStorage["sentry.lang"]) is hydrated in a useEffect after mount.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { DEFAULT_LANG, DICT, type Lang } from "@/messages/dict";

const STORAGE_KEY = "sentry.lang";

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function isLang(value: unknown): value is Lang {
  return value === "en" || value === "es";
}

function resolveInitialLang(): Lang {
  // Always returns DEFAULT_LANG during SSR + first client render to avoid
  // hydration mismatches. The real persisted lang is loaded in useEffect.
  return DEFAULT_LANG;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => resolveInitialLang());

  // Hydrate persisted lang once on the client.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (isLang(stored) && stored !== lang) {
        setLangState(stored);
      }
    } catch {
      // localStorage unavailable (private mode, etc.) — keep default.
    }
    // intentionally only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reflect lang on <html lang="..."> for accessibility.
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    if (!isLang(next)) return;
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      const bag = DICT[lang];
      if (bag && key in bag) return bag[key];
      const fallbackBag = DICT[DEFAULT_LANG];
      if (fallbackBag && key in fallbackBag) return fallbackBag[key];
      return fallback ?? key;
    },
    [lang],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ lang, setLang, t }),
    [lang, setLang, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Soft fallback so a forgotten Provider doesn't crash the page — t()
    // simply returns the key itself, which matches the i18n.js legacy
    // behaviour for unknown keys.
    return {
      lang: DEFAULT_LANG,
      setLang: () => undefined,
      t: (key: string, fallback?: string) => {
        const bag = DICT[DEFAULT_LANG];
        if (bag && key in bag) return bag[key];
        return fallback ?? key;
      },
    };
  }
  return ctx;
}
