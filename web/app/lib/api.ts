export async function api<T>(
  path: string,
  init?: RequestInit,
): Promise<T | null> {
  try {
    const res = await fetch(path, { cache: "no-store", ...init });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export type Summary = {
  total_interactions: number;
  interactions_per_minute: number;
  compliance_rate: number;
  violations: { total_flagged: number; critical: number; warning: number };
};

export type Timeline = {
  labels: string[];
  interactions: number[];
  warnings: number[];
  criticals: number[];
};

export type ByRegulation = {
  items: Array<{ regulation: string; count: number }>;
};

export type Finding = {
  agent: string;
  regulation: string;
  article?: string;
  confidence: number;
  rationale?: string;
};

export type FeedItem = {
  seq: number;
  interaction_id: string;
  created_at: string;
  severity: "critical" | "warning" | "advisory";
  channel: string;
  actor: string;
  response_preview?: string;
  findings?: Finding[];
  action_taken: string;
};

export type Recent = { items: FeedItem[] };

export type Decision = {
  interaction_id: string;
  severity: "critical" | "warning" | "advisory";
  action_taken: string;
  findings: Finding[];
  session_id?: string;
  bot_reply?: string;
};

export type Report = Decision & {
  channel?: string;
  actor?: string;
  request?: string;
  response?: string;
  summary?: string;
  long_report?: string;
  event_hash?: string;
};
