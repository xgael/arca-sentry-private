"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

export type ToastType = "critical" | "warning" | "success" | "info";

interface ToastInput {
  title: string;
  msg: string;
  type?: ToastType;
  timeout?: number;
}

interface ToastEntry extends ToastInput {
  id: number;
  leaving: boolean;
}

interface ToastCtx {
  show: (t: ToastInput) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

const ICONS: Record<ToastType, string> = {
  critical: "🚨",
  warning: "⚠️",
  success: "✓",
  info: "ℹ️",
};

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastEntry[]>([]);

  const show = useCallback((input: ToastInput) => {
    const id = ++counter;
    const entry: ToastEntry = { id, leaving: false, type: "critical", timeout: 5500, ...input };
    setItems((prev) => [...prev, entry]);
    const timeout = entry.timeout ?? 5500;
    setTimeout(() => {
      setItems((prev) => prev.map((e) => (e.id === id ? { ...e, leaving: true } : e)));
      setTimeout(() => setItems((prev) => prev.filter((e) => e.id !== id)), 240);
    }, timeout);
  }, []);

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <div className="toast-container">
        {items.map((it) => (
          <div key={it.id} className={`toast ${it.type ?? "critical"} ${it.leaving ? "toast-leaving" : ""}`}>
            <span className="toast-icon">{ICONS[it.type ?? "critical"]}</span>
            <div className="toast-body">
              <div className="toast-title">{it.title}</div>
              <div className="toast-msg">{it.msg}</div>
            </div>
            <button
              type="button"
              className="toast-close"
              aria-label="close"
              onClick={() =>
                setItems((prev) => prev.map((e) => (e.id === it.id ? { ...e, leaving: true } : e)))
              }
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useToast must be used inside ToastProvider");
  return c;
}
