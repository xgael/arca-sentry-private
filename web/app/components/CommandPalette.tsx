"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  FlaskConical,
  LayoutDashboard,
  Layers,
  MessageSquare,
  Mic,
  Moon,
  Plug,
  PlugZap,
  Plus,
  Sun,
  Target,
  Ticket,
  Wand,
  Zap,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";

type Cmd = {
  id: string;
  label: string;
  hint?: string;
  Icon: React.ComponentType<{ size?: number }>;
  group: "Navigate" | "Action" | "Settings" | "Scenario";
  run: () => void;
};

type Ctx = { open: () => void; close: () => void };
const PaletteCtx = createContext<Ctx>({ open: () => {}, close: () => {} });
export const useCommandPalette = () => useContext(PaletteCtx);

export default function CommandPalette({
  scenarios,
  onRunScenario,
  children,
}: {
  scenarios?: string[];
  onRunScenario?: (name: string) => void;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { theme, toggle: toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const open = useCallback(() => {
    setIsOpen(true);
    setQuery("");
    setActiveIdx(0);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((v) => !v);
        setQuery("");
        setActiveIdx(0);
      } else if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 10);
  }, [isOpen]);

  const navigate = useCallback(
    (href: string) => {
      router.push(href);
      close();
    },
    [router, close],
  );

  const baseCommands: Cmd[] = useMemo(
    () => [
      { id: "nav-dashboard", label: "Dashboard", group: "Navigate", Icon: LayoutDashboard, run: () => navigate("/") },
      { id: "nav-tickets", label: "Tickets", group: "Navigate", Icon: Ticket, run: () => navigate("/tickets") },
      { id: "nav-playground", label: "Playground", group: "Navigate", Icon: MessageSquare, hint: "Test", run: () => navigate("/playground") },
      { id: "nav-voice", label: "Voice", group: "Navigate", Icon: Mic, hint: "Test", run: () => navigate("/voice") },
      { id: "nav-redteam", label: "Red Team", group: "Navigate", Icon: Target, hint: "Test", run: () => navigate("/redteam") },
      { id: "nav-connect", label: "Connect agent", group: "Navigate", Icon: Plus, hint: "Integrate", run: () => navigate("/connect") },
      { id: "nav-proxy", label: "Proxy", group: "Navigate", Icon: Plug, hint: "Integrate", run: () => navigate("/proxy") },
      { id: "nav-autofix", label: "Auto-Fix", group: "Navigate", Icon: Wand, hint: "Integrate", run: () => navigate("/autofix") },
      { id: "nav-architecture", label: "Architecture", group: "Navigate", Icon: Layers, run: () => navigate("/architecture") },
      {
        id: "theme-toggle",
        label: theme === "light" ? "Switch to dark theme" : "Switch to light theme",
        group: "Settings",
        Icon: theme === "light" ? Moon : Sun,
        run: () => {
          toggleTheme();
          close();
        },
      },
    ],
    [navigate, theme, toggleTheme, close],
  );

  const scenarioCommands: Cmd[] = useMemo(() => {
    if (!scenarios || !onRunScenario) return [];
    return scenarios.map((s) => ({
      id: `scenario-${s}`,
      label: `Run scenario · ${s.replace(/_/g, " ")}`,
      group: "Scenario",
      Icon: Zap,
      run: () => {
        onRunScenario(s);
        close();
      },
    }));
  }, [scenarios, onRunScenario, close]);

  const all = useMemo(() => [...baseCommands, ...scenarioCommands], [baseCommands, scenarioCommands]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        (c.hint || "").toLowerCase().includes(q) ||
        c.group.toLowerCase().includes(q),
    );
  }, [all, query]);

  useEffect(() => setActiveIdx(0), [query]);

  useEffect(() => {
    if (!isOpen) return;
    const onArrow = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(filtered.length - 1, i + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const c = filtered[activeIdx];
        if (c) c.run();
      }
    };
    window.addEventListener("keydown", onArrow);
    return () => window.removeEventListener("keydown", onArrow);
  }, [isOpen, filtered, activeIdx]);

  // Group results
  const grouped = useMemo(() => {
    const groups: Record<string, Cmd[]> = {};
    filtered.forEach((c) => {
      (groups[c.group] = groups[c.group] || []).push(c);
    });
    return groups;
  }, [filtered]);

  return (
    <PaletteCtx.Provider value={{ open, close }}>
      {children}
      {isOpen && (
        <div className="cmd-palette-backdrop" onClick={close}>
          <div className="cmd-palette" onClick={(e) => e.stopPropagation()}>
            <div className="cmd-palette-search">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command or search…"
                autoComplete="off"
                spellCheck={false}
              />
              <kbd>ESC</kbd>
            </div>
            <div className="cmd-palette-list">
              {filtered.length === 0 ? (
                <div className="cmd-palette-empty">No commands match "{query}".</div>
              ) : (
                Object.entries(grouped).map(([group, cmds]) => (
                  <div key={group}>
                    <div className="cmd-palette-group">{group}</div>
                    {cmds.map((c) => {
                      const idx = filtered.indexOf(c);
                      const Icon = c.Icon;
                      return (
                        <button
                          key={c.id}
                          className={`cmd-palette-item ${idx === activeIdx ? "active" : ""}`}
                          onMouseEnter={() => setActiveIdx(idx)}
                          onClick={c.run}
                        >
                          <Icon size={16} />
                          <span className="cmd-label">{c.label}</span>
                          {c.hint && <span className="cmd-hint">{c.hint}</span>}
                          <ArrowRight size={14} className="cmd-arrow" />
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
            <div className="cmd-palette-footer">
              <span><kbd>↑↓</kbd> navigate</span>
              <span><kbd>↵</kbd> run</span>
              <span><kbd>⌘K</kbd> toggle</span>
            </div>
          </div>
        </div>
      )}
    </PaletteCtx.Provider>
  );
}
