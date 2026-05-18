"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Ticket,
  MessagesSquare,
  Target,
  Wand,
  Boxes,
  Presentation,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { apiGet } from "@/lib/api";

export type PageKey =
  | "dashboard"
  | "tickets"
  | "chat"
  | "redteam"
  | "autofix"
  | "agents"
  | "pitch";

interface TopbarProps {
  pageKey: PageKey;
}

interface NavSection {
  label: string;
  items: Array<{
    key: PageKey;
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
}

interface NavItem {
  key: PageKey;
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: React.ReactNode;
}

export default function Topbar({ pageKey }: TopbarProps) {
  const { t, lang, setLang } = useT();
  const [live, setLive] = useState(false);
  const [host, setHost] = useState("");
  const [openTickets, setOpenTickets] = useState<number>(0);
  const [autofixEnabled, setAutofixEnabled] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await apiGet<unknown>("/health");
        if (!cancelled) {
          setLive(true);
          setHost(typeof window !== "undefined" ? window.location.host : "");
        }
      } catch {
        if (!cancelled) setLive(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Sidebar signals: open ticket count + auto-fix mode. Polled lightly so any
  // page reflects the cross-cutting state of the system.
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const s = await apiGet<{ open_count: number }>("/tickets/summary");
        if (!cancelled) setOpenTickets(s.open_count ?? 0);
      } catch {/* ignore */}
      try {
        const a = await apiGet<{ enabled: boolean }>("/autofix/settings");
        if (!cancelled) setAutofixEnabled(Boolean(a.enabled));
      } catch {/* ignore */}
    };
    void tick();
    const id = setInterval(tick, 12000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const sections: Array<{ label: string; items: NavItem[] }> = [
    {
      label: t("nav.section.overview", "Overview"),
      items: [
        { key: "dashboard", href: "/", label: t("nav.dashboard"), icon: LayoutDashboard },
        {
          key: "tickets",
          href: "/tickets",
          label: t("nav.tickets"),
          icon: Ticket,
          badge: openTickets > 0 ? (
            <span className="sidebar-badge count">{openTickets > 99 ? "99+" : openTickets}</span>
          ) : undefined,
        },
      ],
    },
    {
      label: t("nav.test", "Test"),
      items: [
        { key: "chat", href: "/chat", label: t("nav.chat", "Chat"), icon: MessagesSquare },
        { key: "redteam", href: "/redteam", label: t("nav.redteam"), icon: Target },
      ],
    },
    {
      label: t("nav.integrate", "Integrate"),
      items: [
        { key: "agents", href: "/agents", label: t("nav.agents", "Agents"), icon: Boxes },
        {
          key: "autofix",
          href: "/autofix",
          label: t("nav.autofix"),
          icon: Wand,
          badge: autofixEnabled ? (
            <span className="sidebar-badge dot" title="Auto-Fix is ON" />
          ) : undefined,
        },
      ],
    },
    {
      label: t("nav.resources", "Resources"),
      items: [
        { key: "pitch", href: "/pitch", label: t("nav.architecture", "Arquitectura"), icon: Presentation },
      ],
    },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo" aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="brand-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#6e95cf" />
                <stop offset="1" stopColor="#2563eb" />
              </linearGradient>
            </defs>
            <path
              d="M16 3 4 7v8.5c0 6 4.7 11.6 12 13.5 7.3-1.9 12-7.5 12-13.5V7L16 3z"
              fill="url(#brand-grad)"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="0.6"
            />
            <path
              d="m10.5 16.2 3.7 3.6L22 12"
              stroke="#ffffff"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>
        <div className="brand-text">
          <div className="brand-name">
            ARCA <strong>SENTRY</strong>
          </div>
          <div className="brand-sub">Compliance OS</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {sections.map((section) => (
          <div className="sidebar-section" key={section.label}>
            <div className="sidebar-section-label">{section.label}</div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = pageKey === item.key;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`sidebar-link ${active ? "active" : ""}`}
                >
                  <Icon className="icon-svg" />
                  <span className="sidebar-link-label">{item.label}</span>
                  {item.badge}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="cmdk-hint" aria-hidden="true">
          <span>Quick search</span>
          <span className="kbd-row"><kbd>⌘</kbd><kbd>K</kbd></span>
        </div>
        <div className={`status-pill ${live ? "live" : ""}`}>
          <span className="dot" />
          <span className="status-text">
            {live ? t("status.live") : t("status.connecting")}
          </span>
        </div>
        {host && <div className="sidebar-host">{host}</div>}
        <select
          className="lang-switch"
          value={lang}
          onChange={(e) => setLang(e.target.value as typeof lang)}
          aria-label="Switch language"
        >
          <option value="en">🇬🇧 EN</option>
          <option value="es">🇲🇽 ES</option>
          <option value="it">🇮🇹 IT</option>
          <option value="pt">🇧🇷 PT</option>
          <option value="zh">🇨🇳 ZH</option>
        </select>
      </div>
    </aside>
  );
}
