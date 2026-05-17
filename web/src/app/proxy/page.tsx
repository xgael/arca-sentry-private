"use client";

import { useEffect, useMemo, useState } from "react";
import Topbar from "@/components/chrome/Topbar";
import Card from "@/components/ui/Card";
import { apiGet } from "@/lib/api";

type SnippetKey = "openai" | "openai-node" | "anthropic" | "gemini" | "langchain";

export default function ProxyPage() {
  const [pane, setPane] = useState<SnippetKey>("openai");
  const [origin, setOrigin] = useState("https://sentry.example.com");
  const [total, setTotal] = useState<number>(0);

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
    apiGet<{ total_proxied: number }>("/proxy/status").then((d) => setTotal(d.total_proxied)).catch(() => {});
  }, []);

  const baseV1 = `${origin}/v1`;
  const base = origin;

  const snippets: Record<SnippetKey, string> = useMemo(() => ({
    "openai": `# Before
from openai import OpenAI
client = OpenAI(api_key="sk-...")

# After — only base_url changed
client = OpenAI(
    api_key="sk-...",
    base_url="${baseV1}",
)

# The rest of your code stays IDENTICAL
resp = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "Why was my loan denied?"}],
)
print(resp.choices[0].message.content)
# SENTRY headers in resp.response (X-Sentry-Severity, X-Sentry-Action, ...)`,
    "openai-node": `// Before
import OpenAI from "openai";
const client = new OpenAI({ apiKey: "sk-..." });

// After
const client = new OpenAI({
  apiKey: "sk-...",
  baseURL: "${baseV1}",
});

// Same call
const resp = await client.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: "Why was my loan denied?" }],
});`,
    "anthropic": `# Before
import anthropic
client = anthropic.Anthropic(api_key="sk-ant-...")

# After
client = anthropic.Anthropic(
    api_key="sk-ant-...",
    base_url="${base}",
)

# Same call
msg = client.messages.create(
    model="claude-3-5-sonnet-latest",
    max_tokens=400,
    messages=[{"role": "user", "content": "Why was my loan denied?"}],
)`,
    "gemini": `# Just change the endpoint URL
curl -X POST \\
  "${base}/v1beta/models/gemini-2.5-pro:generateContent?key=$GEMINI_KEY" \\
  -H 'Content-Type: application/json' \\
  -d '{
    "contents": [{"parts": [{"text": "Why was my loan denied?"}]}]
  }'`,
    "langchain": `# LangChain works because it wraps OpenAI SDK
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    model="gpt-4o-mini",
    api_key="sk-...",
    base_url="${baseV1}",
)

# All of LangChain — agents, chains, retrievers — now audited by SENTRY`,
  }), [baseV1, base]);

  return (
    <>
      <Topbar pageKey="proxy" />
      <main className="arch-main">
        <section className="arch-hero">
          <div className="arch-hero-text">
            <div className="pg-hero-eyebrow">Drop-in compatibility</div>
            <h1 className="arch-hero-title">Connect any AI agent in one line of code</h1>
            <p className="arch-hero-sub">
              Point your OpenAI / Anthropic / Gemini client at SENTRY&apos;s URL instead of the upstream provider. Every call is audited in flight: critical violations are blocked at the gateway with HTTP 451, warnings pass through with diagnostic headers. Zero code changes beyond the base URL.
            </p>
          </div>
          <div className="arch-hero-metrics">
            <div className="metric-card"><div className="metric-val">{total}</div><div className="metric-lbl">Requests proxied</div></div>
            <div className="metric-card"><div className="metric-val">3</div><div className="metric-lbl">Provider APIs supported</div></div>
            <div className="metric-card"><div className="metric-val">1 line</div><div className="metric-lbl">Code changes required</div></div>
            <div className="metric-card"><div className="metric-val">HTTP 451</div><div className="metric-lbl">On compliance block</div></div>
          </div>
        </section>

        <Card className="arch-card" title="Pick your provider — copy, paste, ship" subtitle="Every snippet below works against your existing code. Just change base_url (OpenAI) / SDK URL (Anthropic) / endpoint URL (Gemini).">
          <div className="snippet-tabs">
            {([
              ["openai", "OpenAI · Python"],
              ["openai-node", "OpenAI · Node"],
              ["anthropic", "Anthropic · Python"],
              ["gemini", "Gemini · curl"],
              ["langchain", "LangChain"],
            ] as Array<[SnippetKey, string]>).map(([k, label]) => (
              <button
                key={k}
                type="button"
                className={`snippet-tab ${pane === k ? "active" : ""}`}
                onClick={() => setPane(k)}
              >
                {label}
              </button>
            ))}
          </div>
          <pre><code>{snippets[pane]}</code></pre>
        </Card>

        <Card className="arch-card" title="What you get in every response" subtitle="Headers added by SENTRY on every proxied response, so your application can react to the verdict programmatically.">
          <table className="headers-table">
            <tbody>
              <tr><th>Header</th><th>Values</th><th>Meaning</th></tr>
              <tr><td><code>X-Sentry-Severity</code></td><td>advisory · warning · critical</td><td>Verdict from the audit. Critical never reaches here — it returns 451 instead.</td></tr>
              <tr><td><code>X-Sentry-Action</code></td><td>allow · warn · block</td><td>Action SENTRY took.</td></tr>
              <tr><td><code>X-Sentry-Interaction-Id</code></td><td>UUID</td><td>Use to look up the full audit record via <code>/reports/{`{id}`}.json</code>.</td></tr>
              <tr><td><code>X-Sentry-Finding-Count</code></td><td>0, 1, 2…</td><td>How many auditors flagged something.</td></tr>
              <tr><td><code>X-Sentry-Primary-Regulation</code></td><td>eu_ai_act · gdpr · dora · pii_leak · prompt_injection</td><td>Top-priority regulation flagged.</td></tr>
              <tr><td><code>X-Sentry-Primary-Article</code></td><td>Article number string</td><td>The specific article being violated.</td></tr>
            </tbody>
          </table>
        </Card>

        <Card className="arch-card" title="What happens on a CRITICAL violation" subtitle="SENTRY returns HTTP 451 (Unavailable for Legal Reasons) instead of forwarding the upstream response. The body matches the shape your SDK expects, so your existing error-handling path catches it.">
          <pre><code>{`HTTP/1.1 451 Unavailable For Legal Reasons
X-Sentry-Severity: critical
X-Sentry-Action: block
X-Sentry-Primary-Regulation: prompt_injection
X-Sentry-Primary-Article: Prompt Injection (OWASP LLM01)
Content-Type: application/json

{
  "error": {
    "message": "Response blocked by SENTRY · Prompt Injection · The AI verbatim disclosed both its system prompt and an API key…",
    "type": "compliance_block",
    "code": "blocked_by_sentry"
  }
}`}</code></pre>
        </Card>
      </main>

      <footer className="footer">
        ARCA SENTRY · Continuous compliance auditing for enterprise AI
      </footer>
    </>
  );
}
