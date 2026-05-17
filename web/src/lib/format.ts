export const REG_LABELS: Record<string, string> = {
  eu_ai_act: "EU AI Act",
  gdpr: "GDPR",
  dora: "DORA",
  pii_leak: "PII Leak",
  prompt_injection: "Prompt Injection",
};

export const REG_COLORS: Record<string, string> = {
  eu_ai_act: "#2563eb",
  gdpr: "#b91c1c",
  dora: "#0369a1",
  pii_leak: "#6d28d9",
  prompt_injection: "#334155",
};

export const CHANNEL_ICONS: Record<string, string> = {
  text: "💬",
  voice: "🎙",
  api: "🔌",
};

export const REG_TOAST_ICONS: Record<string, string> = {
  prompt_injection: "🧨",
  pii_leak: "📤",
  gdpr: "⚖",
  eu_ai_act: "🚨",
  dora: "🏦",
};

export const LANG_TAG: Record<string, string> = {
  credit_denial: "EN",
  credit_denial_es: "ES",
  pii_leak: "EN",
  prompt_injection: "EN",
  dora_incident: "EN",
  voice_no_disclosure: "IT",
};

export function escapeHtml(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-GB");
  } catch {
    return iso;
  }
}
