"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  Siren,
  TriangleAlert,
  CircleCheckBig,
  Info,
  Bell,
} from "lucide-react";

type ToastType = "critical" | "warning" | "success" | "info";
type Toast = { id: number; title: string; msg: string; type: ToastType; leaving?: boolean };

type Ctx = (t: Omit<Toast, "id">) => void;
const ToastCtx = createContext<Ctx>(() => {});
export const useToast = () => useContext(ToastCtx);

const ICONS: Record<ToastType, React.ComponentType<{ size?: number }>> = {
  critical: Siren,
  warning: TriangleAlert,
  success: CircleCheckBig,
  info: Info,
};

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((cur) => [...cur, { ...t, id }]);
    setTimeout(() => {
      setToasts((cur) => cur.map((x) => (x.id === id ? { ...x, leaving: true } : x)));
      setTimeout(() => setToasts((cur) => cur.filter((x) => x.id !== id)), 240);
    }, 5500);
  }, []);

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => {
          const Icon = ICONS[t.type] ?? Bell;
          return (
            <div key={t.id} className={`toast ${t.type} ${t.leaving ? "toast-leaving" : ""}`}>
              <span className="toast-icon"><Icon size={20} /></span>
              <div className="toast-body">
                <div className="toast-title">{t.title}</div>
                <div className="toast-msg">{t.msg}</div>
              </div>
              <button
                className="toast-close"
                aria-label="close"
                onClick={() =>
                  setToasts((cur) =>
                    cur.map((x) => (x.id === t.id ? { ...x, leaving: true } : x)),
                  )
                }
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
