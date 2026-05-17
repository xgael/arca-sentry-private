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

export const CHANNEL_ICONS = {
  text: "message-square",
  voice: "mic",
  api: "plug-zap",
} as const;

export const LANG_TAG: Record<string, string> = {
  credit_denial: "EN",
  credit_denial_es: "ES",
  pii_leak: "EN",
  prompt_injection: "EN",
  dora_incident: "EN",
  voice_no_disclosure: "IT",
};

export const REG_ICON_LUCIDE: Record<string, string> = {
  prompt_injection: "Bomb",
  pii_leak: "UploadCloud",
  eu_ai_act: "Siren",
  gdpr: "Scale",
  dora: "Landmark",
};
