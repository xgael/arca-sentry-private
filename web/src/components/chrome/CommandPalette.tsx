"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Ticket,
  MessagesSquare,
  Target,
  Wand,
  Boxes,
  PlusCircle,
  Presentation,
  Languages,
  Zap,
  Search,
} from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { useT } from "@/lib/i18n";

interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  group: string;
  icon: React.ComponentType<{ className?: string }>;
  run: () => void | Promise<void>;
}

// Scenario → regulation mapping for cmdK grouping. Falls back to "Demo · Other"
// if the backend ships a scenario not in this map.
const SCENARIO_REG: Record<string, { label: string; reg: string }> = {
  credit_denial:        { label: "EU AI Act", reg: "eu_ai_act" },
  credit_denial_es:     { label: "EU AI Act", reg: "eu_ai_act" },
  voice_no_disclosure:  { label: "EU AI Act", reg: "eu_ai_act" },
  pii_leak:             { label: "GDPR · PII", reg: "pii_leak" },
  gdpr_erasure:         { label: "GDPR", reg: "gdpr" },
  prompt_injection:     { label: "Prompt Injection", reg: "prompt_injection" },
  dora_incident:        { label: "DORA", reg: "dora" },
};

function scenarioGroup(name: string): string {
  const m = SCENARIO_REG[name];
  return `Demo · ${m?.label ?? "Other"}`;
}

export default function CommandPalette() {
  const router = useRouter();
  const { lang, setLang } = useT();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [scenarios, setScenarios] = useState<string[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Load demo scenarios once for the "Demo" group.
  useEffect(() => {
    apiGet<{ scenarios: string[] }>("/demo/scenarios")
      .then((d) => setScenarios(d.scenarios ?? []))
      .catch(() => {});
  }, []);

  // Global ⌘K / Ctrl+K to toggle, Esc to close.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  const runScenario = useCallback(
    async (name: string) => {
      close();
      try {
        await apiPost("/demo/run", { scenario: name });
        if (typeof window !== "undefined" && window.location.pathname !== "/") {
          router.push("/");
        }
      } catch {/* swallow */}
    },
    [close, router],
  );

  const goto = useCallback(
    (path: string) => () => {
      close();
      router.push(path);
    },
    [close, router],
  );

  const items: CommandItem[] = useMemo(() => {
    const nav: CommandItem[] = [
      { id: "nav-dashboard", group: "Navigate", label: "Dashboard", hint: "Overview · KPIs · live feed", icon: LayoutDashboard, run: goto("/") },
      { id: "nav-tickets", group: "Navigate", label: "Tickets", hint: "Compliance remediation queue", icon: Ticket, run: goto("/tickets") },
      { id: "nav-chat", group: "Navigate", label: "Chat", hint: "Talk to the vulnerable bot (text + voice)", icon: MessagesSquare, run: goto("/chat") },
      { id: "nav-redteam", group: "Navigate", label: "Red Team", hint: "Run pen-test attack suite", icon: Target, run: goto("/redteam") },
      { id: "nav-agents", group: "Navigate", label: "Agents", hint: "Registered AI agents · list + profiles", icon: Boxes, run: goto("/agents") },
      { id: "nav-agents-new", group: "Navigate", label: "Connect agent", hint: "Open the registration wizard", icon: PlusCircle, run: goto("/agents?new=1") },
      { id: "nav-autofix", group: "Navigate", label: "Auto-Fix", hint: "Rewrite flagged responses", icon: Wand, run: goto("/autofix") },
      { id: "nav-pitch", group: "Navigate", label: "Arquitectura", hint: "How it works · architecture · proxy", icon: Presentation, run: goto("/pitch") },
    ];
    // Sort scenarios by group label so they cluster together in the list,
    // even though our header-rendering pass keys off `group` change.
    const demoSorted = [...scenarios].sort((a, b) =>
      scenarioGroup(a).localeCompare(scenarioGroup(b)) || a.localeCompare(b),
    );
    const demo: CommandItem[] = demoSorted.map((s) => ({
      id: `demo-${s}`,
      group: scenarioGroup(s),
      label: s.replace(/_/g, " "),
      hint: "Run demo scenario",
      icon: Zap,
      run: () => runScenario(s),
    }));
    const sys: CommandItem[] = [
      {
        id: "sys-lang",
        group: "System",
        label: lang === "en" ? "Switch language → Spanish" : "Switch language → English",
        hint: "Toggle EN ↔ ES",
        icon: Languages,
        run: () => { setLang(lang === "en" ? "es" : "en"); close(); },
      },
    ];
    return [...nav, ...demo, ...sys];
  }, [scenarios, goto, runScenario, lang, setLang, close]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) =>
      it.label.toLowerCase().includes(q) || it.hint?.toLowerCase().includes(q),
    );
  }, [items, query]);

  useEffect(() => { setActiveIdx(0); }, [query]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[activeIdx];
      if (item) void item.run();
    }
  }

  if (!open) return null;

  let lastGroup: CommandItem["group"] | null = null;

  return (
    <div className="cmdk-backdrop" onClick={close}>
      <div className="cmdk-panel" onClick={(e) => e.stopPropagation()}>
        <div className="cmdk-input-row">
          <Search className="cmdk-search-icon" />
          <input
            ref={inputRef}
            className="cmdk-input"
            placeholder="Type a command, page, or scenario…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
          />
          <kbd className="cmdk-kbd">esc</kbd>
        </div>

        <div className="cmdk-list" ref={listRef}>
          {filtered.length === 0 && (
            <div className="cmdk-empty">No results for &quot;{query}&quot;</div>
          )}
          {filtered.map((it, i) => {
            const showHeader = it.group !== lastGroup;
            lastGroup = it.group;
            const Icon = it.icon;
            const active = i === activeIdx;
            return (
              <div key={it.id}>
                {showHeader && <div className="cmdk-group">{it.group}</div>}
                <button
                  type="button"
                  className={`cmdk-item ${active ? "active" : ""}`}
                  data-idx={i}
                  onMouseEnter={() => setActiveIdx(i)}
                  onClick={() => void it.run()}
                >
                  <Icon className="cmdk-item-icon" />
                  <span className="cmdk-item-label">{it.label}</span>
                  {it.hint && <span className="cmdk-item-hint">{it.hint}</span>}
                </button>
              </div>
            );
          })}
        </div>

        <div className="cmdk-footer">
          <span><kbd>↑</kbd> <kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> select</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
