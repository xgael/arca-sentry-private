"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";
import "../architecture/architecture.css";
import "../playground/playground.css";

type Tab = "openai" | "openai-node" | "anthropic" | "gemini" | "langchain";

export default function ProxyPage() {
  const [tab, setTab] = useState<Tab>("openai");
  const [origin, setOrigin] = useState("");
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setOrigin(window.location.origin);
    api<{ total_proxied: number }>("/api/proxy/status").then((d) => {
      if (d) setTotal(d.total_proxied);
    });
  }, []);

  const baseV1 = `${origin}/v1`;
  const baseRoot = origin;

  return (
    <div className="arch-main">
      <section className="arch-hero">
        <div className="arch-hero-text">
          <div className="pg-hero-eyebrow">Drop-in compatibility</div>
          <h1 className="arch-hero-title">Connect any AI agent in one line of code</h1>
          <p className="arch-hero-sub">
            Point your OpenAI / Anthropic / Gemini client at SENTRY's URL instead of the upstream
            provider. Every call is audited in flight: critical violations are blocked at the gateway
            with HTTP 451, warnings pass through with diagnostic headers. Zero code changes beyond the
            base URL.
          </p>
        </div>
        <div className="arch-hero-metrics">
          <div className="metric-card"><div className="metric-val">{total}</div><div className="metric-lbl">Requests proxied</div></div>
          <div className="metric-card"><div className="metric-val">3</div><div className="metric-lbl">Provider APIs supported</div></div>
          <div className="metric-card"><div className="metric-val">1 line</div><div className="metric-lbl">Code changes required</div></div>
          <div className="metric-card"><div className="metric-val">HTTP 451</div><div className="metric-lbl">On compliance block</div></div>
        </div>
      </section>

      <section className="card arch-card">
        <div className="card-head">
          <h2>Pick your provider — copy, paste, ship</h2>
          <p className="muted">
            Every snippet below works against your existing code. Just change <code>base_url</code>{" "}
            (OpenAI) / SDK URL (Anthropic) / endpoint URL (Gemini).
          </p>
        </div>

        <div className="snippet-tabs">
          {([
            ["openai", "OpenAI · Python"],
            ["openai-node", "OpenAI · Node"],
            ["anthropic", "Anthropic · Python"],
            ["gemini", "Gemini · curl"],
            ["langchain", "LangChain"],
          ] as Array<[Tab, string]>).map(([t, label]) => (
            <button
              key={t}
              className={`snippet-tab ${tab === t ? "active" : ""}`}
              onClick={() => setTab(t)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "openai" && (
          <div className="snippet-pane active">
            <pre>
              <code>
                <span className="hl-com"># Before</span>
                {"\nfrom openai import OpenAI\nclient = OpenAI(api_key=\"sk-...\")\n\n"}
                <span className="hl-com"># After — only base_url changed</span>
                {"\nclient = OpenAI(\n    api_key=\"sk-...\",\n    "}
                <span className="hl-key">base_url=&quot;{baseV1}&quot;</span>
                {",\n)\n\n"}
                <span className="hl-com"># The rest of your code stays IDENTICAL</span>
                {"\nresp = client.chat.completions.create(\n    model=\"gpt-4o-mini\",\n    messages=[{\"role\": \"user\", \"content\": \"Why was my loan denied?\"}],\n)\nprint(resp.choices[0].message.content)\n"}
                <span className="hl-com"># SENTRY headers in resp.response (X-Sentry-Severity, X-Sentry-Action, ...)</span>
              </code>
            </pre>
          </div>
        )}

        {tab === "openai-node" && (
          <div className="snippet-pane active">
            <pre>
              <code>
                <span className="hl-com">// Before</span>
                {"\nimport OpenAI from \"openai\";\nconst client = new OpenAI({ apiKey: \"sk-...\" });\n\n"}
                <span className="hl-com">// After</span>
                {"\nconst client = new OpenAI({\n  apiKey: \"sk-...\",\n  "}
                <span className="hl-key">baseURL: &quot;{baseV1}&quot;</span>
                {",\n});\n\n"}
                <span className="hl-com">// Same call</span>
                {"\nconst resp = await client.chat.completions.create({\n  model: \"gpt-4o-mini\",\n  messages: [{ role: \"user\", content: \"Why was my loan denied?\" }],\n});"}
              </code>
            </pre>
          </div>
        )}

        {tab === "anthropic" && (
          <div className="snippet-pane active">
            <pre>
              <code>
                <span className="hl-com"># Before</span>
                {"\nimport anthropic\nclient = anthropic.Anthropic(api_key=\"sk-ant-...\")\n\n"}
                <span className="hl-com"># After</span>
                {"\nclient = anthropic.Anthropic(\n    api_key=\"sk-ant-...\",\n    "}
                <span className="hl-key">base_url=&quot;{baseRoot}&quot;</span>
                {",\n)\n\n"}
                <span className="hl-com"># Same call</span>
                {"\nmsg = client.messages.create(\n    model=\"claude-3-5-sonnet-latest\",\n    max_tokens=400,\n    messages=[{\"role\": \"user\", \"content\": \"Why was my loan denied?\"}],\n)"}
              </code>
            </pre>
          </div>
        )}

        {tab === "gemini" && (
          <div className="snippet-pane active">
            <pre>
              <code>
                <span className="hl-com"># Just change the endpoint URL</span>
                {"\ncurl -X POST \\\n  \""}
                <span className="hl-key">{baseRoot}/v1beta/models/gemini-2.5-pro:generateContent?key=$GEMINI_KEY</span>
                {"\" \\\n  -H 'Content-Type: application/json' \\\n  -d '{\n    \"contents\": [{\"parts\": [{\"text\": \"Why was my loan denied?\"}]}]\n  }'"}
              </code>
            </pre>
          </div>
        )}

        {tab === "langchain" && (
          <div className="snippet-pane active">
            <pre>
              <code>
                <span className="hl-com"># LangChain works because it wraps OpenAI SDK</span>
                {"\nfrom langchain_openai import ChatOpenAI\n\nllm = ChatOpenAI(\n    model=\"gpt-4o-mini\",\n    api_key=\"sk-...\",\n    "}
                <span className="hl-key">base_url=&quot;{baseV1}&quot;</span>
                {",\n)\n\n"}
                <span className="hl-com"># All of LangChain — agents, chains, retrievers — now audited by SENTRY</span>
              </code>
            </pre>
          </div>
        )}
      </section>

      <section className="card arch-card">
        <div className="card-head">
          <h2>What you get in every response</h2>
          <p className="muted">
            Headers added by SENTRY on every proxied response, so your application can react to the
            verdict programmatically.
          </p>
        </div>
        <table className="headers-table">
          <tbody>
            <tr><th>Header</th><th>Values</th><th>Meaning</th></tr>
            <tr><td><code>X-Sentry-Severity</code></td><td>advisory · warning · critical</td><td>Verdict from the audit. Critical never reaches here — it returns 451 instead.</td></tr>
            <tr><td><code>X-Sentry-Action</code></td><td>allow · warn · block</td><td>Action SENTRY took.</td></tr>
            <tr><td><code>X-Sentry-Interaction-Id</code></td><td>UUID</td><td>Use to look up the full audit record via <code>/reports/{"{"}id{"}"}.json</code>.</td></tr>
            <tr><td><code>X-Sentry-Finding-Count</code></td><td>0, 1, 2…</td><td>How many auditors flagged something.</td></tr>
            <tr><td><code>X-Sentry-Primary-Regulation</code></td><td>eu_ai_act · gdpr · dora · pii_leak · prompt_injection</td><td>Top-priority regulation flagged.</td></tr>
            <tr><td><code>X-Sentry-Primary-Article</code></td><td>Article number string</td><td>The specific article being violated.</td></tr>
          </tbody>
        </table>
      </section>

      <section className="card arch-card">
        <div className="card-head">
          <h2>What happens on a CRITICAL violation</h2>
          <p className="muted">
            SENTRY returns HTTP 451 (Unavailable for Legal Reasons) instead of forwarding the upstream
            response. The body matches the shape your SDK expects, so your existing error-handling path
            catches it.
          </p>
        </div>
        <pre>
          <code>{`HTTP/1.1 451 Unavailable For Legal Reasons
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
}`}</code>
        </pre>
      </section>
    </div>
  );
}
