"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
type Ctx = { theme: Theme; toggle: () => void; set: (t: Theme) => void };
const ThemeCtx = createContext<Ctx>({
  theme: "light",
  toggle: () => {},
  set: () => {},
});
export const useTheme = () => useContext(ThemeCtx);

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sentry-theme") as Theme | null;
    const prefersDark =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial: Theme = stored ?? (prefersDark ? "dark" : "light");
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
    setMounted(true);
  }, []);

  const applyTheme = useCallback((t: Theme) => {
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("sentry-theme", t);
  }, []);

  const toggle = useCallback(() => {
    const next: Theme = theme === "light" ? "dark" : "light";
    // Use view transition for theme swap if supported
    interface DocWithTransition extends Document {
      startViewTransition?: (cb: () => void) => { ready: Promise<void> };
    }
    const doc = document as DocWithTransition;
    if (doc.startViewTransition) {
      doc.startViewTransition(() => applyTheme(next));
    } else {
      applyTheme(next);
    }
  }, [theme, applyTheme]);

  return (
    <ThemeCtx.Provider value={{ theme, toggle, set: applyTheme }}>
      <div suppressHydrationWarning>{mounted ? children : children}</div>
    </ThemeCtx.Provider>
  );
}
