"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FlaskConical,
  LayoutDashboard,
  Layers,
  Menu,
  Mic,
  MessageSquare,
  CirclePlus,
  Moon,
  Plug,
  Search,
  Sun,
  Target,
  Ticket,
  Wand,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "./ThemeProvider";
import { useCommandPalette } from "./CommandPalette";

type NavLeaf = { href: string; label: string; Icon: React.ComponentType<{ size?: number }> };
type NavGroup = { label: string; Icon: React.ComponentType<{ size?: number }>; items: NavLeaf[] };
type NavEntry = NavLeaf | NavGroup;

const NAV: NavEntry[] = [
  { href: "/", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/tickets", label: "Tickets", Icon: Ticket },
  {
    label: "Test",
    Icon: FlaskConical,
    items: [
      { href: "/playground", label: "Playground", Icon: MessageSquare },
      { href: "/voice", label: "Voice", Icon: Mic },
      { href: "/redteam", label: "Red Team", Icon: Target },
    ],
  },
  {
    label: "Integrate",
    Icon: Plug,
    items: [
      { href: "/connect", label: "Connect agent", Icon: CirclePlus },
      { href: "/proxy", label: "Proxy", Icon: Plug },
      { href: "/autofix", label: "Auto-Fix", Icon: Wand },
    ],
  },
  { href: "/architecture", label: "Architecture", Icon: Layers },
];

function isGroup(entry: NavEntry): entry is NavGroup {
  return "items" in entry;
}

export default function Header() {
  const pathname = usePathname();
  const { theme, toggle: toggleTheme } = useTheme();
  const { open: openPalette } = useCommandPalette();
  const [status, setStatus] = useState<{
    state: "connecting" | "connected" | "offline";
    meta: string;
  }>({ state: "connecting", meta: "" });
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile nav on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        if (cancelled) return;
        if (res.ok) {
          const j = await res.json().catch(() => ({}));
          setStatus({
            state: "connected",
            meta: j.adapter ? `· ${j.adapter}` : "",
          });
        } else {
          setStatus({ state: "offline", meta: "" });
        }
      } catch {
        if (!cancelled) setStatus({ state: "offline", meta: "" });
      }
    }
    check();
    const t = setInterval(check, 8000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

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
          <div className="brand-sub">Compliance Operations Center</div>
        </div>
      </div>

      <nav className="tabs">
        {NAV.map((entry) =>
          isGroup(entry) ? (
            <NavGroupMenu key={entry.label} entry={entry} pathname={pathname} />
          ) : (
            <NavLink key={entry.href} entry={entry} active={pathname === entry.href} />
          )
        )}
      </nav>

      <div className="topbar-right">
        <button
          className="cmd-trigger"
          onClick={openPalette}
          aria-label="Open command palette"
          title="Command palette"
        >
          <Search size={14} />
          <kbd>⌘K</kbd>
        </button>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
          title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
        >
          {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
        </button>
        <div className="status-pill">
          <span className={`dot ${status.state}`} />
          <span>
            {status.state === "connecting"
              ? "connecting…"
              : status.state === "connected"
                ? "online"
                : "offline"}
          </span>
          <span className="status-meta">{status.meta}</span>
        </div>
        <button
          className="mobile-toggle"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      <div className={`mobile-nav ${mobileOpen ? "open" : ""}`}>
        <div className="mobile-nav-inner">
          {NAV.map((entry) =>
            isGroup(entry) ? (
              <div key={entry.label} className="mobile-nav-group">
                <div className="mobile-nav-group-label">{entry.label}</div>
                {entry.items.map((leaf) => {
                  const LIcon = leaf.Icon;
                  return (
                    <Link
                      key={leaf.href}
                      href={leaf.href}
                      className={`mobile-nav-item ${pathname === leaf.href ? "active" : ""}`}
                    >
                      <LIcon size={16} />
                      <span>{leaf.label}</span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <Link
                key={entry.href}
                href={entry.href}
                className={`mobile-nav-item ${pathname === entry.href ? "active" : ""}`}
              >
                <entry.Icon size={16} />
                <span>{entry.label}</span>
              </Link>
            ),
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({ entry, active }: { entry: NavLeaf; active: boolean }) {
  const { Icon } = entry;
  return (
    <Link href={entry.href} className={`tab ${active ? "active" : ""}`}>
      <Icon size={16} />
      <span>{entry.label}</span>
    </Link>
  );
}

function NavGroupMenu({ entry, pathname }: { entry: NavGroup; pathname: string }) {
  const active = entry.items.some((it) => it.href === pathname);
  const { Icon } = entry;
  return (
    <div className={`tab-group ${active ? "has-active active" : ""}`} tabIndex={0}>
      <span className={`tab ${active ? "active" : ""}`}>
        <Icon size={16} />
        <span>{entry.label}</span>
        <span className="caret">▾</span>
      </span>
      <div className="tab-menu">
        {entry.items.map((leaf) => {
          const LIcon = leaf.Icon;
          return (
            <Link
              key={leaf.href}
              href={leaf.href}
              className={`tab ${pathname === leaf.href ? "active" : ""}`}
            >
              <LIcon size={16} />
              <span>{leaf.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
