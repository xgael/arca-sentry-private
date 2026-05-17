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

const SUBKEY: Record<PageKey, string> = {
  dashboard: "brand.sub.ops",
  tickets: "brand.sub.ops",
  playground: "brand.sub.playground",
  voice: "brand.sub.voice",
  redteam: "brand.sub.redteam",
  connect: "brand.sub.ops",
  proxy: "brand.sub.proxy",
  autofix: "brand.sub.autofix",
  architecture: "brand.sub.arch",
  agent: "brand.sub.ops",
};

const TEST_GROUP: PageKey[] = ["playground", "voice", "redteam"];
const INTEGRATE_GROUP: PageKey[] = ["connect", "proxy", "autofix"];

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

  const testHasActive = TEST_GROUP.includes(pageKey);
  const integrateHasActive = INTEGRATE_GROUP.includes(pageKey);

  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-logo">
          <span className="brand-logo-letter">S</span>
        </div>
        <div className="brand-text">
          <div className="brand-name">
            ARCA <strong>SENTRY</strong>
          </div>
          <div className="brand-sub">{t(SUBKEY[pageKey])}</div>
        </div>
      </div>

      <nav className="tabs">
        <Link href="/" className={`tab ${pageKey === "dashboard" ? "active" : ""}`}>
          <LayoutDashboard className="icon-svg" />
          <span>{t("nav.dashboard")}</span>
        </Link>
        <Link href="/tickets" className={`tab ${pageKey === "tickets" ? "active" : ""}`}>
          <Ticket className="icon-svg" />
          <span>{t("nav.tickets")}</span>
        </Link>

        <div className={`tab-group ${testHasActive ? "has-active" : ""}`} tabIndex={0}>
          <span className="tab">
            <FlaskConical className="icon-svg" />
            <span>{t("nav.test")}</span>
            <span className="caret">▾</span>
          </span>
          <div className="tab-menu">
            <Link href="/playground" className={`tab ${pageKey === "playground" ? "active" : ""}`}>
              <MessageSquare className="icon-svg" />
              <span>{t("nav.playground")}</span>
            </Link>
            <Link href="/voice" className={`tab ${pageKey === "voice" ? "active" : ""}`}>
              <Mic className="icon-svg" />
              <span>{t("nav.voice")}</span>
            </Link>
            <Link href="/redteam" className={`tab ${pageKey === "redteam" ? "active" : ""}`}>
              <Target className="icon-svg" />
              <span>{t("nav.redteam")}</span>
            </Link>
          </div>
        </div>

        <div className={`tab-group ${integrateHasActive ? "has-active" : ""}`} tabIndex={0}>
          <span className="tab">
            <Plug className="icon-svg" />
            <span>{t("nav.integrate")}</span>
            <span className="caret">▾</span>
          </span>
          <div className="tab-menu">
            <Link href="/connect" className={`tab ${pageKey === "connect" ? "active" : ""}`}>
              <PlusCircle className="icon-svg" />
              <span>Connect agent</span>
            </Link>
            <Link href="/proxy" className={`tab ${pageKey === "proxy" ? "active" : ""}`}>
              <Plug className="icon-svg" />
              <span>{t("nav.proxy")}</span>
            </Link>
            <Link href="/autofix" className={`tab ${pageKey === "autofix" ? "active" : ""}`}>
              <Wand className="icon-svg" />
              <span>{t("nav.autofix")}</span>
            </Link>
          </div>
        </div>

        <Link href="/architecture" className={`tab ${pageKey === "architecture" ? "active" : ""}`}>
          <Layers className="icon-svg" />
          <span>{t("nav.architecture")}</span>
        </Link>
      </nav>

      <div className="topbar-right">
        <button
          type="button"
          className="lang-switch"
          onClick={() => setLang(lang === "en" ? "es" : "en")}
          aria-label="Switch language"
        >
          {lang === "en" ? "🇪🇸 ES" : "🇬🇧 EN"}
        </button>
        <div className={`status-pill ${live ? "live" : ""}`}>
          <span className="dot" />
          <span className="status-text">
            {live ? t("status.live") : t("status.connecting")}
          </span>
          {host && <span className="status-meta">{host}</span>}
        </div>
      </div>
    </header>
  );
}
