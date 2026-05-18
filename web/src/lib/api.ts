// Always go through the Next.js `/api/*` rewrite so the browser sees a
// same-origin request. The rewrite (see next.config.ts) forwards to the
// real backend (read from NEXT_PUBLIC_API_URL). This sidesteps CORS even
// if the backend doesn't ship CORSMiddleware.
function url(path: string): string {
  if (path.startsWith("http")) return path;
  return `/api${path.startsWith("/") ? path : `/${path}`}`;
}

export async function apiGet<T>(path: string): Promise<T> {
  const r = await fetch(url(path), { cache: "no-store" });
  if (!r.ok) throw new Error(`GET ${path} → ${r.status}`);
  return r.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const r = await fetch(url(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`POST ${path} → ${r.status}`);
  return r.json() as Promise<T>;
}

export function apiUrl(path: string): string {
  return url(path);
}

export type Severity = "advisory" | "warning" | "critical";
export type Regulation = "eu_ai_act" | "gdpr" | "dora" | "pii_leak" | "prompt_injection";
export type Action = "allow" | "warn" | "block";

export interface Finding {
  agent: string;
  regulation: Regulation;
  confidence: number;
  rationale: string;
  article?: string | null;
}

export interface FeedItem {
  seq: number;
  interaction_id: string;
  created_at: string;
  severity: Severity;
  channel: string;
  actor: string;
  response_preview: string;
  findings: Finding[];
  action_taken: Action;
}

export interface SummaryStats {
  compliance_rate: number;
  violations: { critical: number; warning: number; advisory: number; total_flagged: number };
  total_interactions: number;
  interactions_per_minute: number;
}

export interface TimelineData {
  labels: string[];
  interactions: number[];
  warnings: number[];
  criticals: number[];
}

export interface RegStats {
  items: Array<{ regulation: Regulation; count: number }>;
}

export interface AuditReport {
  interaction_id: string;
  severity: Severity;
  channel: string;
  actor: string;
  request: string;
  response: string;
  summary: string;
  findings: Finding[];
  long_report?: string;
  event_hash?: string;
}

export interface Ticket {
  ticket_id: string;
  title: string;
  status: "open" | "in_progress" | "resolved" | "dismissed";
  severity: Severity;
  estimated_cost?: number;
  suggestion?: string;
  suggestion_code?: string;
  interaction_id: string;
  created_at: string;
}
