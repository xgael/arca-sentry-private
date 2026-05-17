"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Ticket,
  MessagesSquare,
  Target,
  PlusCircle,
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
  | "connect"
  | "autofix"
  | "agent"
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

export default function Topbar({ pageKey }: TopbarProps) {
  const { t, lang, setLang } = useT();
  const [live, setLive] = useState(false);
  const [host, setHost] = useState("");

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

  const sections: NavSection[] = [
    {
      label: t("nav.section.overview", "Overview"),
      items: [
        { key: "dashboard", href: "/", label: t("nav.dashboard"), icon: LayoutDashboard },
        { key: "tickets", href: "/tickets", label: t("nav.tickets"), icon: Ticket },
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
        { key: "connect", href: "/connect", label: t("nav.connect", "Connect agent"), icon: PlusCircle },
        { key: "autofix", href: "/autofix", label: t("nav.autofix"), icon: Wand },
        { key: "agent", href: "/agent", label: t("nav.agents", "Agents"), icon: Boxes },
      ],
    },
    {
      label: t("nav.resources", "Resources"),
      items: [
        { key: "pitch", href: "/pitch", label: t("nav.pitch", "Pitch"), icon: Presentation },
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
                  <span>{item.label}</span>
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
        <button
          type="button"
          className="lang-switch"
          onClick={() => setLang(lang === "en" ? "es" : "en")}
          aria-label="Switch language"
        >
          {lang === "en" ? "🇪🇸 ES" : "🇬🇧 EN"}
        </button>
      </div>
    </aside>
  );
}
