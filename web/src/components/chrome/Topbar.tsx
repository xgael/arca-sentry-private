"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Ticket,
  MessageSquare,
  Mic,
  Target,
  PlusCircle,
  Plug,
  Wand,
  Layers,
  FlaskConical,
  Boxes,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { apiGet } from "@/lib/api";

export type PageKey =
  | "dashboard"
  | "tickets"
  | "playground"
  | "voice"
  | "redteam"
  | "connect"
  | "proxy"
  | "autofix"
  | "architecture"
  | "agent";

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
        { key: "playground", href: "/playground", label: t("nav.playground"), icon: MessageSquare },
        { key: "voice", href: "/voice", label: t("nav.voice"), icon: Mic },
        { key: "redteam", href: "/redteam", label: t("nav.redteam"), icon: Target },
      ],
    },
    {
      label: t("nav.integrate", "Integrate"),
      items: [
        { key: "connect", href: "/connect", label: t("nav.connect", "Connect agent"), icon: PlusCircle },
        { key: "proxy", href: "/proxy", label: t("nav.proxy"), icon: Plug },
        { key: "autofix", href: "/autofix", label: t("nav.autofix"), icon: Wand },
      ],
    },
    {
      label: t("nav.system", "System"),
      items: [
        { key: "architecture", href: "/architecture", label: t("nav.architecture"), icon: Layers },
        { key: "agent", href: "/agent", label: t("nav.agents", "Agents"), icon: Boxes },
      ],
    },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">
          <span className="brand-logo-letter">S</span>
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
