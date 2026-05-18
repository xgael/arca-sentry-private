// ARCA SENTRY — i18n dictionary (en + es).
// Ported from api/dashboard/static/i18n.js. Some values intentionally contain
// HTML fragments (e.g. <code>, <strong>, <span class="sev-pill ...">) and must
// be rendered via dangerouslySetInnerHTML at the consuming component.

export type Lang = "en" | "es" | "it" | "pt" | "zh";

export const LANG_LABELS: Record<Lang, string> = {
  en: "🇬🇧 EN",
  es: "🇲🇽 ES",
  it: "🇮🇹 IT",
  pt: "🇧🇷 PT",
  zh: "🇨🇳 ZH",
};

export const DICT: Record<Lang, Record<string, string>> = {
  en: {
    // ── topbar ──────────────────────────────────────────────────────────
    "brand.sub.ops": "Compliance Operations Center",
    "brand.sub.playground": "Live Playground · talk to a vulnerable bot, watch SENTRY audit",
    "brand.sub.voice": "Voice Channel Audit · speak to the bot, watch SENTRY listen",
    "brand.sub.proxy": "Proxy mode · drop-in for OpenAI, Anthropic, Gemini",
    "brand.sub.redteam": "Red Team · automated pen-testing for AI agents",
    "brand.sub.autofix": "Auto-Fix · rewrites flagged responses inline",
    "brand.sub.arch": "Architecture · how the system works under the hood",
    "nav.dashboard": "Dashboard",
    "nav.tickets": "Tickets",
    "nav.playground": "Playground",
    "nav.voice": "Voice",
    "nav.test": "Test",
    "nav.integrate": "Integrate",
    "nav.proxy": "Proxy",
    "nav.redteam": "Red Team",
    "nav.autofix": "Auto-Fix",
    "nav.architecture": "Architecture",
    "nav.github": "GitHub →",
    "status.connecting": "connecting…",
    "status.live": "live",
    "status.offline": "offline",

    // ── KPI ─────────────────────────────────────────────────────────────
    "kpi.compliance": "Compliance rate",
    "kpi.compliance.sub": "last 24h",
    "kpi.critical": "Critical violations",
    "kpi.critical.sub": "blocked at gateway",
    "kpi.warning": "Warnings",
    "kpi.warning.sub": "compliance team notified",
    "kpi.total": "Interactions audited",
    "kpi.total.sub": "/min · live",

    // ── demo bar ────────────────────────────────────────────────────────
    "demo.title": "Try it live",
    "demo.desc":
      "Click a scenario to run a synthetic AI interaction through the full pipeline. Six pre-loaded violations across EU AI Act, GDPR, DORA, PII and prompt injection — in English, Spanish and Italian.",

    // ── charts ──────────────────────────────────────────────────────────
    "chart.donut.title": "Compliance overview",
    "chart.donut.sub": "24h breakdown",
    "chart.timeline.title": "Violations timeline",
    "chart.timeline.sub": "Interactions vs warnings vs criticals, hourly buckets",
    "chart.regs.title": "Top regulations flagged",
    "chart.regs.sub": "Findings by regulation, last 24h",
    "chart.council.title": "Auditor council",
    "chart.council.sub": "5 specialized agents, current load",

    // ── feed ────────────────────────────────────────────────────────────
    "feed.title": "Live event stream",
    "feed.desc": "Click any row for full forensic detail · auto-refreshes every 3 s",
    "feed.filter.all": "All",
    "feed.filter.critical": "Critical",
    "feed.filter.warning": "Warning",
    "feed.filter.advisory": "Advisory",
    "feed.col.time": "Time",
    "feed.col.severity": "Severity",
    "feed.col.channel": "Channel",
    "feed.col.actor": "Actor",
    "feed.col.snippet": "Snippet",
    "feed.col.findings": "Findings",
    "feed.col.action": "Action",
    "feed.empty.initial": "No events yet — click a demo scenario to start.",
    "feed.empty.filtered": "No events match the current filter.",

    // ── drawer ──────────────────────────────────────────────────────────
    "drawer.title": "Audit detail",
    "drawer.section.transcript": "Conversation transcript",
    "drawer.section.findings": "Auditor findings",
    "drawer.section.report": "Compliance report — Gemini Pro",
    "drawer.section.hash": "Tamper-evident event hash · SHA-256",
    "drawer.no_findings": "No findings — every agent cleared this interaction.",
    "drawer.no_transcript": "This interaction was logged without a transcript.",
    "drawer.download_pdf": "Download PDF",
    "drawer.raw_json": "Raw JSON",
    "drawer.html_view": "HTML view",
    "drawer.role.user": "User",
    "drawer.role.ai": "AI",

    // ── verdict ─────────────────────────────────────────────────────────
    "verdict.advisory": "Advisory · logged only",
    "verdict.warning": "Warning · compliance team notified",
    "verdict.critical": "Critical · response BLOCKED at gateway",

    // ── playground ──────────────────────────────────────────────────────
    "pg.toolbar.bot_label": "Bot under audit:",
    "pg.toolbar.reset": "↺ Reset conversation",
    "pg.toolbar.hint_html":
      "The bot is <strong>intentionally vulnerable</strong> for demo purposes. Try the suggested attacks below or type your own.",
    "pg.suggested.title": "Try one of these",
    "pg.suggested.desc": "Click any prompt to send it to the bot and watch SENTRY react.",
    "pg.conversation.title": "Conversation",
    "pg.empty.line1": "Start typing below — or click a suggested attack above.",
    "pg.empty.line2": "Every exchange is audited by SENTRY in real time.",
    "pg.input.placeholder": "Type a message to the bot… (Enter to send)",
    "pg.send": "Send →",
    "pg.sentry.title": "SENTRY · live audit",
    "pg.sentry.awaiting": "awaiting interaction…",
    "pg.sentry.empty_verdict": "No interactions audited yet.",
    "pg.sentry.no_findings": "No findings — all five agents cleared this interaction.",
    // — added (not in original i18n.js) —
    "pg.hero.eyebrow": "Interactive demo",
    "pg.hero.title": "Talk to a deliberately vulnerable bank chatbot",
    "pg.hero.sub":
      "Send any message — the bot is configured to leak credentials, expose PII and skip mandatory disclosures. SENTRY audits the exchange in real time and shows you exactly what would trigger a regulatory fine.",
    "pg.hero.stat.msgs": "Messages this session",
    "pg.hero.stat.flags": "Violations caught",
    "pg.sentry.auditing": "auditing…",
    "pg.sentry.error": "error · check logs",

    // ── voice ───────────────────────────────────────────────────────────
    "voice.hero.title": "Speak to a vulnerable voice bot",
    "voice.hero.desc1":
      "Push the microphone, ask a question that a real bank's voice agent might mishandle, and watch SENTRY transcribe and audit the call in real time. Spanish, English, Italian and Portuguese all work.",
    "voice.hero.desc2":
      "Uses your browser's microphone via the Web Speech API for transcription, and Speechmatics is configured on the backend for production-grade STT.",
    "voice.mic.idle": "Hold to talk",
    "voice.mic.listening": "Listening — release",
    "voice.transcript.title": "Live transcript",
    "voice.transcript.idle": "tap mic to start",
    "voice.transcript.recording": "● recording — speak now",
    "voice.transcript.audit": "auditing…",
    "voice.transcript.empty1": "Hold the microphone button and speak.",
    "voice.transcript.empty2":
      "When you stop talking, the bot replies and SENTRY audits the exchange.",
    "voice.suggestions.title": "Suggested scripts to read aloud",
    "voice.suggestions.desc":
      "Try saying any of these — the bot is configured to stumble on each one, giving SENTRY plenty to flag.",
    // — added (not in original i18n.js) —
    "voice.hero.eyebrow": "Voice channel audit",
    "voice.mic.unsupported": "Not supported",
    "voice.mic.interrupt": "⏹ tap to interrupt",
    "voice.transcript.no_speech": "no speech captured — try again",
    "voice.transcript.bot_speaking": "bot speaking…",

    // ── alert banner ────────────────────────────────────────────────────
    "alert.detected": "VIOLATION DETECTED",

    // ── architecture ────────────────────────────────────────────────────
    "arch.hero.eyebrow": "System architecture",
    "arch.hero.title": "A continuous compliance brain for enterprise AI",
    "arch.hero.sub":
      "ARCA SENTRY is a multi-agent system that audits every interaction your AI produces, in real time, against EU regulatory frameworks. Built around five specialized auditor agents, a Gemini Pro synthesizer, and an append-only hash-chained event store — every decision is forensically reproducible and tamper-evident by design.",
    "arch.metric.latency": "End-to-end p95 latency",
    "arch.metric.agents": "Specialized auditor agents",
    "arch.metric.integrity": "Audit log integrity (SHA-256)",
    "arch.metric.langs": "Languages supported",
    "arch.flow.title": "Request flow · how an interaction becomes an audited decision",
    "arch.flow.desc":
      "Every chat or voice exchange goes through the same six-stage pipeline. Stages run in parallel where possible — total wall time stays under six seconds even with frontier models in the synthesizer.",
    "arch.flow.s1.title": "Capture",
    "arch.flow.s1.desc":
      "Production AI sends every interaction to <code>POST /audit</code>. Voice calls stream through Speechmatics with speaker diarization.",
    "arch.flow.s2.title": "Orchestrator",
    "arch.flow.s2.desc":
      "Builds an <code>Interaction</code> and fans out to all five auditor agents simultaneously via <code>asyncio.gather</code>.",
    "arch.flow.s3.title": "Auditor council",
    "arch.flow.s3.desc":
      "Five domain-specialized models inspect the exchange in parallel. Each returns a <code>Finding</code> with confidence 0.0–1.0.",
    "arch.flow.s4.title": "Severity engine",
    "arch.flow.s4.desc":
      'Findings are classified into <span class="sev-pill advisory">advisory</span> <span class="sev-pill warning">warning</span> <span class="sev-pill critical">critical</span>. Consensus rule blocks single-agent false positives.',
    "arch.flow.s5.title": "Synthesizer",
    "arch.flow.s5.desc":
      "Gemini 2.5 Pro composes the auditable report in the source language. Includes article citations and recommended action.",
    "arch.flow.s6.title": "Persist & act",
    "arch.flow.s6.desc":
      "Every event appends to the SHA-256-chained event store. Tickets auto-open with cost estimate. Critical responses block at the gateway.",
    "arch.agents.title": "The five auditor agents · domain-specialized by design",
    "arch.agents.desc":
      "Each agent owns one regulation or risk family. They share a base class (heuristic pre-filter → specialized LLM judgment) but use different system prompts and different open-source models from Featherless. This keeps p95 low: most interactions skip the LLM call entirely.",
    "arch.ag.euaiact.title": "Transparency, oversight & disclosure",
    "arch.ag.euaiact.desc":
      "Flags automated consequential decisions (credit, hiring, eligibility) lacking explanation or human-review path. Also fires when a voice agent denies being an AI under Art. 50.",
    "arch.ag.gdpr.title": "Data subject rights",
    "arch.ag.gdpr.desc":
      "Detects unlawful processing, opaque automated decisions, refused access requests, and erasure denials. Cross-checks with PII Leak for compound breaches.",
    "arch.ag.dora.title": "Digital operational resilience",
    "arch.ag.dora.desc":
      "Catches incidents being denied, hidden third-party dependencies, opaque trading advice, and missing incident-reporting channels. Specific to EU financial entities post-Jan 2025.",
    "arch.ag.pii.title": "Volunteered personal data",
    "arch.ag.pii.desc":
      "Deterministic regex bank: email, IBAN, credit card, codice fiscale, CURP, RFC, SSN, passport, DNI, phone. LLM confirms whether the leak was solicited (legitimate retrieval) or volunteered (breach pattern).",
    "arch.ag.pi.title": "OWASP LLM01 — direct + indirect injection",
    "arch.ag.pi.desc":
      "Two-stage detection: attack-side markers in the user request <strong>and</strong> compliance-side regex in the AI response (leaked system prompts, leaked credentials, broken character).",
    "arch.severity.title": "Severity model · three tiers, consensus protected",
    "arch.severity.desc":
      "A single hallucinating agent cannot unilaterally block production traffic. Critical fires only when multiple agents converge — or when the evidence is irrefutable.",
    "arch.sev.adv.action": "action: allow",
    "arch.sev.warn.action": "action: warn",
    "arch.sev.crit.action": "action: block",
    "arch.sev.adv.desc":
      "Logged to event store only. No alert. Useful for trending and weak-signal monitoring.",
    "arch.sev.warn.desc":
      "Compliance team notified. Ticket auto-opens with cost estimate. Response is not blocked.",
    "arch.sev.crit.desc":
      "Response is intercepted at the gateway before it reaches the end user. Ticket flagged red. Synthesizer report dispatched to compliance lead.",
    "arch.integrity.title": "Tamper-evident audit log · forensic by default",
    "arch.integrity.desc":
      "Every event the system observes — interactions, findings, decisions, ticket status changes — appends to a SHA-256 hash-chained event store. The chain is verifiable end-to-end in a single call.",
    "arch.int.chain.title": "Hash chain",
    "arch.int.chain.desc":
      "Each record carries a SHA-256 hash that combines the previous record's hash plus the new payload. Modifying a past event invalidates every hash downstream.",
    "arch.int.append.title": "Append-only at app layer",
    "arch.int.append.desc":
      "The <code>EventStore</code> class exposes no UPDATE or DELETE methods. Workflow state changes (open → resolved) are themselves new events.",
    "arch.int.verify.title": "Verifiable in O(n)",
    "arch.int.verify.desc":
      "<code>EventStore.verify_integrity()</code> recomputes the chain end-to-end. Returns false on any inconsistency. Regulators can run it on a copy of the database.",
    "arch.int.pg.title": "Postgres alternative",
    "arch.int.pg.desc":
      "For enterprise deployments, an optional Postgres schema enforces immutability at the database layer via row-level triggers preventing UPDATE/DELETE.",
    "arch.stack.title": "Technology stack",
    "arch.stack.desc":
      "Linux-first, ARM64-native, asyncio throughout. Designed to run on a single Vultr VM for SMB and to scale horizontally on Kubernetes for enterprise.",
    "arch.stack.inf": "Inference",
    "arch.stack.run": "Runtime",
    "arch.stack.persist": "Persistence",
    "arch.stack.deploy": "Deployment",
    "arch.stack.front": "Frontend",
    "arch.stack.qa": "Quality",
    "arch.perf.title": "Performance envelope",
    "arch.perf.desc":
      "Measured on the production NVIDIA Grace ARM64 instance, against real Featherless and Gemini endpoints.",
    "arch.perf.p1.lbl": "p95 latency, no-flag interaction",
    "arch.perf.p1.note": "Regex pre-filters short-circuit before any LLM call.",
    "arch.perf.p2.lbl": "p95 latency, single agent fires",
    "arch.perf.p2.note": "One Featherless call. Synthesizer triggered only if findings exist.",
    "arch.perf.p3.lbl": "p95 latency, full critical event",
    "arch.perf.p3.note": "All five agents fire in parallel + Gemini synthesizer.",
    "arch.perf.p4.lbl": "Sustained throughput, single instance",
    "arch.perf.p4.note": "Per-model semaphore prevents 429 cascades.",
    "arch.perf.p5.lbl": "False positive rate on synthetic corpus",
    "arch.perf.p5.note": "Consensus rule on critical eliminates single-agent hallucinations.",
    "arch.perf.p6.lbl": "Event store size",
    "arch.perf.p6.note": "SQLite with JSON payloads. Indexed by interaction_id, type, time.",
    "arch.sec.title": "Security guarantees",
    "arch.sec.desc":
      "Built-in by default; nothing optional. Aligned to OWASP LLM Top 10, SOC 2 readiness, and EU AI Act enforcement controls.",
    "arch.sec.secrets.title": "No secrets in transit or at rest",
    "arch.sec.secrets.desc":
      "API keys live in <code>.env</code> outside git. The vulnerable demo bot's fake keys are explicit hooks for testing — verified deterministically.",
    "arch.sec.injection.title": "Prompt injection hardened",
    "arch.sec.injection.desc":
      "System prompts are constructed with explicit separators. Every agent uses structured JSON output. Compliance-side regex catches credential leaks if a downstream bot is compromised.",
    "arch.sec.auditable.title": "Auditable by regulators",
    "arch.sec.auditable.desc":
      "Any decision can be replayed deterministically from the event store. PDF reports include event hash for chain-of-custody verification.",
    "arch.sec.reversible.title": "Human-reversible blocks",
    "arch.sec.reversible.desc":
      "A blocking decision is itself a logged event. Operators can override (status: dismissed) without modifying historical findings.",
    "arch.topo.title": "Deployment topologies",
    "arch.topo.desc":
      "From a single 1-vCPU Vultr instance to a multi-region Kubernetes cluster.",
    "arch.topo.smb.tier": "SMB / Demo",
    "arch.topo.mid.tier": "Mid-market",
    "arch.topo.ent.tier": "Enterprise",

    // ── tickets ─────────────────────────────────────────────────────────
    "tickets.title": "Compliance tickets · auto-generated remediations",
    "tickets.kpi.open": "Open tickets",
    "tickets.kpi.open.sub": "awaiting remediation",
    "tickets.kpi.exposure": "Estimated exposure",
    "tickets.kpi.exposure.sub": "potential fines if not remediated",
    "tickets.kpi.resolved": "Resolved",
    "tickets.kpi.resolved.sub": "closed out",
    "tickets.kpi.total": "Total tickets",
    "tickets.kpi.total.sub": "all time",
    "tickets.list": "Remediation queue",
    "tickets.list.desc":
      "Every warning or critical detected by SENTRY becomes a ticket here, with an estimated cost if left unresolved and a suggested fix.",
    "tickets.filter.all": "All",
    "tickets.filter.open": "Open",
    "tickets.filter.in_progress": "In progress",
    "tickets.filter.resolved": "Resolved",
    "tickets.filter.dismissed": "Dismissed",

    // ── red team (added — not in original i18n.js) ──────────────────────
    "rt.hero.eyebrow": "Automated pen-testing",
    "rt.hero.title": "Pick an agent · launch 30 attacks · get a resilience score",
    "rt.hero.sub":
      "Click any agent below. SENTRY runs the OWASP LLM Top 10 attacks, classic jailbreaks (DAN, AIM, grandma), indirect injection, PII fishing, EU AI Act traps, DORA incident denial, and authority impersonation against it. Returns a 0–100 resilience score plus the exact prompts that broke through.",
    "rt.metric.catalog": "Attacks in catalog",
    "rt.metric.runtime": "Typical run time",
    "rt.metric.categories": "Attack categories",
    "rt.metric.score": "Resilience score",
    "rt.target.title": "Pick a target agent",
    "rt.target.desc":
      "Click any of the agents SENTRY is currently auditing. The pen test runs the full attack suite against the selected agent — no API keys required for the built-in demo agents.",
    "rt.target.loading": "Loading agents…",
    "rt.custom.summary": "⚙ Use a custom external agent instead (advanced)",
    "rt.custom.provider": "Provider",
    "rt.custom.model": "Model",
    "rt.custom.key": "API key (not stored)",
    "rt.custom.system": "System prompt (optional)",
    "rt.custom.run": "⚡ Run pen test on custom agent",
    "rt.running.title": "Running pen test…",
    "rt.running.sub":
      "Sending attacks against the selected agent. Each takes 1–3 seconds.",
    "rt.running.init": "Initializing…",
    "rt.running.complete": "Complete.",
    "rt.results.title": "Results",
    "rt.results.score": "Resilience score",
    "rt.results.vulnerable": "✗ VULNERABLE",
    "rt.results.resisted": "✓ Resisted",
    "rt.results.attacker_prompt": "🎯 Attacker prompt",
    "rt.results.bot_response": "💬 Bot response (leaked)",
    "rt.results.attempted": "Attempted prompt",
    "rt.results.run_cta": "⚡ Run pen test",
    "rt.export.pdf": "📄 Download PDF report",
    "rt.export.copy": "📋 Copy summary to clipboard",
    "rt.export.share": "🔗 Generate share link",
  },

  es: {
    // ── topbar ──────────────────────────────────────────────────────────
    "brand.sub.ops": "Centro de Operaciones de Cumplimiento",
    "brand.sub.playground":
      "Demo en vivo · habla con un bot vulnerable, mira cómo SENTRY audita",
    "brand.sub.voice":
      "Auditoría de Canal de Voz · habla con el bot, mira a SENTRY escuchar",
    "brand.sub.proxy": "Modo proxy · drop-in para OpenAI, Anthropic, Gemini",
    "brand.sub.redteam": "Red Team · pen-testing automatizado para agentes de IA",
    "brand.sub.autofix": "Auto-Fix · reescribe respuestas marcadas en línea",
    "brand.sub.arch": "Arquitectura · cómo funciona el sistema por dentro",
    "nav.dashboard": "Panel",
    "nav.tickets": "Tickets",
    "nav.playground": "Demo",
    "nav.voice": "Voz",
    "nav.test": "Test",
    "nav.integrate": "Integrar",
    "nav.proxy": "Proxy",
    "nav.redteam": "Red Team",
    "nav.autofix": "Auto-Fix",
    "nav.architecture": "Arquitectura",
    "nav.github": "GitHub →",
    "status.connecting": "conectando…",
    "status.live": "en vivo",
    "status.offline": "desconectado",

    // ── KPI ─────────────────────────────────────────────────────────────
    "kpi.compliance": "Tasa de cumplimiento",
    "kpi.compliance.sub": "últimas 24 h",
    "kpi.critical": "Violaciones críticas",
    "kpi.critical.sub": "bloqueadas en la puerta",
    "kpi.warning": "Advertencias",
    "kpi.warning.sub": "equipo de cumplimiento notificado",
    "kpi.total": "Interacciones auditadas",
    "kpi.total.sub": "/min · en vivo",

    // ── demo bar ────────────────────────────────────────────────────────
    "demo.title": "Pruébalo en vivo",
    "demo.desc":
      "Haz clic en un escenario para ejecutar una interacción sintética por el pipeline completo. Seis violaciones precargadas en EU AI Act, GDPR, DORA, PII e inyección de prompt — en inglés, español e italiano.",

    // ── charts ──────────────────────────────────────────────────────────
    "chart.donut.title": "Resumen de cumplimiento",
    "chart.donut.sub": "desglose 24 h",
    "chart.timeline.title": "Línea temporal de violaciones",
    "chart.timeline.sub": "Interacciones vs advertencias vs críticas, por hora",
    "chart.regs.title": "Regulaciones más violadas",
    "chart.regs.sub": "Hallazgos por regulación, últimas 24 h",
    "chart.council.title": "Concilio de auditores",
    "chart.council.sub": "5 agentes especializados, carga actual",

    // ── feed ────────────────────────────────────────────────────────────
    "feed.title": "Flujo de eventos en vivo",
    "feed.desc":
      "Haz clic en cualquier fila para ver el detalle forense · se actualiza cada 3 s",
    "feed.filter.all": "Todos",
    "feed.filter.critical": "Críticos",
    "feed.filter.warning": "Advertencia",
    "feed.filter.advisory": "Informativo",
    "feed.col.time": "Hora",
    "feed.col.severity": "Severidad",
    "feed.col.channel": "Canal",
    "feed.col.actor": "Actor",
    "feed.col.snippet": "Fragmento",
    "feed.col.findings": "Hallazgos",
    "feed.col.action": "Acción",
    "feed.empty.initial": "Sin eventos aún — haz clic en un escenario para empezar.",
    "feed.empty.filtered": "Ningún evento coincide con el filtro actual.",

    // ── drawer ──────────────────────────────────────────────────────────
    "drawer.title": "Detalle de auditoría",
    "drawer.section.transcript": "Transcripción de la conversación",
    "drawer.section.findings": "Hallazgos de los auditores",
    "drawer.section.report": "Reporte de cumplimiento — Gemini Pro",
    "drawer.section.hash": "Hash a prueba de manipulación · SHA-256",
    "drawer.no_findings": "Sin hallazgos — todos los agentes aprobaron esta interacción.",
    "drawer.no_transcript": "Esta interacción se registró sin transcripción.",
    "drawer.download_pdf": "Descargar PDF",
    "drawer.raw_json": "JSON crudo",
    "drawer.html_view": "Vista HTML",
    "drawer.role.user": "Usuario",
    "drawer.role.ai": "IA",

    // ── verdict ─────────────────────────────────────────────────────────
    "verdict.advisory": "Informativo · solo registrado",
    "verdict.warning": "Advertencia · equipo de cumplimiento notificado",
    "verdict.critical": "Crítico · respuesta BLOQUEADA en la puerta",

    // ── playground ──────────────────────────────────────────────────────
    "pg.toolbar.bot_label": "Bot auditado:",
    "pg.toolbar.reset": "↺ Reiniciar conversación",
    "pg.toolbar.hint_html":
      "El bot es <strong>vulnerable a propósito</strong> para fines de demo. Prueba los ataques sugeridos abajo o escribe el tuyo.",
    "pg.suggested.title": "Prueba uno de estos",
    "pg.suggested.desc":
      "Haz clic en cualquier prompt para enviarlo al bot y ver cómo reacciona SENTRY.",
    "pg.conversation.title": "Conversación",
    "pg.empty.line1": "Empieza a escribir abajo — o haz clic en un ataque sugerido arriba.",
    "pg.empty.line2": "Cada intercambio es auditado por SENTRY en tiempo real.",
    "pg.input.placeholder": "Escribe un mensaje al bot… (Enter para enviar)",
    "pg.send": "Enviar →",
    "pg.sentry.title": "SENTRY · auditoría en vivo",
    "pg.sentry.awaiting": "esperando interacción…",
    "pg.sentry.empty_verdict": "Ninguna interacción auditada todavía.",
    "pg.sentry.no_findings": "Sin hallazgos — los cinco agentes aprobaron esta interacción.",
    // — added —
    "pg.hero.eyebrow": "Demo interactivo",
    "pg.hero.title": "Habla con un chatbot bancario deliberadamente vulnerable",
    "pg.hero.sub":
      "Envía cualquier mensaje — el bot está configurado para filtrar credenciales, exponer PII y omitir avisos obligatorios. SENTRY audita el intercambio en tiempo real y te muestra exactamente qué dispararía una multa regulatoria.",
    "pg.hero.stat.msgs": "Mensajes esta sesión",
    "pg.hero.stat.flags": "Violaciones capturadas",
    "pg.sentry.auditing": "auditando…",
    "pg.sentry.error": "error · revisa los logs",

    // ── voice ───────────────────────────────────────────────────────────
    "voice.hero.title": "Habla con un bot de voz vulnerable",
    "voice.hero.desc1":
      "Presiona el micrófono, haz una pregunta que un agente de voz bancario podría manejar mal, y observa cómo SENTRY transcribe y audita la llamada en tiempo real. Funciona en español, inglés, italiano y portugués.",
    "voice.hero.desc2":
      "Usa el micrófono del navegador a través de la Web Speech API para transcripción, y Speechmatics está configurado en el backend para STT de producción.",
    "voice.mic.idle": "Mantén para hablar",
    "voice.mic.listening": "Escuchando — suelta",
    "voice.transcript.title": "Transcripción en vivo",
    "voice.transcript.idle": "toca el mic para empezar",
    "voice.transcript.recording": "● grabando — habla ahora",
    "voice.transcript.audit": "auditando…",
    "voice.transcript.empty1": "Mantén el botón del micrófono y habla.",
    "voice.transcript.empty2":
      "Cuando termines, el bot responde y SENTRY audita el intercambio.",
    "voice.suggestions.title": "Frases sugeridas para leer en voz alta",
    "voice.suggestions.desc":
      "Prueba decir alguna de estas — el bot está configurado para tropezar con cada una, dándole a SENTRY mucho que marcar.",
    // — added —
    "voice.hero.eyebrow": "Auditoría de canal de voz",
    "voice.mic.unsupported": "No soportado",
    "voice.mic.interrupt": "⏹ toca para interrumpir",
    "voice.transcript.no_speech": "no se capturó voz — intenta de nuevo",
    "voice.transcript.bot_speaking": "bot hablando…",

    // ── alert banner ────────────────────────────────────────────────────
    "alert.detected": "VIOLACIÓN DETECTADA",

    // ── architecture ────────────────────────────────────────────────────
    "arch.hero.eyebrow": "Arquitectura del sistema",
    "arch.hero.title": "Un cerebro de cumplimiento continuo para IA empresarial",
    "arch.hero.sub":
      "ARCA SENTRY es un sistema multi-agente que audita cada interacción que produce tu IA, en tiempo real, contra los marcos regulatorios europeos. Construido sobre cinco agentes auditores especializados, un sintetizador Gemini Pro, y un almacén de eventos encadenado por hash — cada decisión es forensicamente reproducible y a prueba de manipulación por diseño.",
    "arch.metric.latency": "Latencia p95 extremo a extremo",
    "arch.metric.agents": "Agentes auditores especializados",
    "arch.metric.integrity": "Integridad del log (SHA-256)",
    "arch.metric.langs": "Idiomas soportados",
    "arch.flow.title":
      "Flujo de petición · cómo una interacción se convierte en decisión auditada",
    "arch.flow.desc":
      "Cada intercambio de chat o voz pasa por el mismo pipeline de seis etapas. Las etapas corren en paralelo donde es posible — el tiempo total se mantiene bajo seis segundos incluso con modelos de frontera en el sintetizador.",
    "arch.flow.s1.title": "Captura",
    "arch.flow.s1.desc":
      "La IA productiva envía cada interacción a <code>POST /audit</code>. Las llamadas de voz pasan por Speechmatics con diarización de hablantes.",
    "arch.flow.s2.title": "Orquestador",
    "arch.flow.s2.desc":
      "Construye una <code>Interaction</code> y la reparte a los cinco agentes auditores simultáneamente vía <code>asyncio.gather</code>.",
    "arch.flow.s3.title": "Concilio auditor",
    "arch.flow.s3.desc":
      "Cinco modelos especializados por dominio inspeccionan el intercambio en paralelo. Cada uno devuelve un <code>Finding</code> con confianza 0.0–1.0.",
    "arch.flow.s4.title": "Motor de severidad",
    "arch.flow.s4.desc":
      'Los hallazgos se clasifican en <span class="sev-pill advisory">informativo</span> <span class="sev-pill warning">advertencia</span> <span class="sev-pill critical">crítico</span>. La regla de consenso bloquea falsos positivos de un solo agente.',
    "arch.flow.s5.title": "Sintetizador",
    "arch.flow.s5.desc":
      "Gemini 2.5 Pro compone el reporte auditable en el idioma de origen. Incluye citas de artículos y acción recomendada.",
    "arch.flow.s6.title": "Persistir y actuar",
    "arch.flow.s6.desc":
      "Cada evento se anexa al event store encadenado por SHA-256. Los tickets se abren automáticamente con costo estimado. Las respuestas críticas se bloquean en el gateway.",
    "arch.agents.title": "Los cinco agentes auditores · especializados por dominio",
    "arch.agents.desc":
      "Cada agente es dueño de una regulación o familia de riesgo. Comparten una clase base (pre-filtro heurístico → juicio LLM especializado) pero usan system prompts y modelos open-source distintos de Featherless. Esto mantiene la latencia p95 baja: la mayoría de interacciones se saltan la llamada al LLM por completo.",
    "arch.ag.euaiact.title": "Transparencia, supervisión y divulgación",
    "arch.ag.euaiact.desc":
      "Marca decisiones automatizadas consecuentes (crédito, contratación, elegibilidad) sin explicación o sin vía de revisión humana. También dispara cuando un agente de voz niega ser una IA bajo el Art. 50.",
    "arch.ag.gdpr.title": "Derechos del interesado",
    "arch.ag.gdpr.desc":
      "Detecta procesamiento ilegal, decisiones automatizadas opacas, solicitudes de acceso rechazadas y denegaciones de borrado. Verifica con PII Leak para violaciones compuestas.",
    "arch.ag.dora.title": "Resiliencia operacional digital",
    "arch.ag.dora.desc":
      "Detecta incidentes negados, dependencias de terceros ocultas, asesoría de trading opaca y canales de reporte de incidentes ausentes. Específico para entidades financieras de la UE post-enero 2025.",
    "arch.ag.pii.title": "Datos personales no solicitados",
    "arch.ag.pii.desc":
      "Banco de regex deterministas: email, IBAN, tarjeta de crédito, codice fiscale, CURP, RFC, SSN, pasaporte, DNI, teléfono. El LLM confirma si la fuga fue solicitada (recuperación legítima) o voluntaria (patrón de brecha).",
    "arch.ag.pi.title": "OWASP LLM01 — inyección directa e indirecta",
    "arch.ag.pi.desc":
      "Detección en dos etapas: marcadores del lado del ataque en la petición del usuario <strong>y</strong> regex del lado de cumplimiento en la respuesta de la IA (system prompts filtrados, credenciales filtradas, personaje roto).",
    "arch.severity.title": "Modelo de severidad · tres niveles, protegido por consenso",
    "arch.severity.desc":
      "Un solo agente alucinando no puede bloquear unilateralmente tráfico productivo. CRITICAL se dispara solo cuando varios agentes convergen — o cuando la evidencia es irrefutable.",
    "arch.sev.adv.action": "acción: permitir",
    "arch.sev.warn.action": "acción: advertir",
    "arch.sev.crit.action": "acción: bloquear",
    "arch.sev.adv.desc":
      "Sólo se registra en el event store. Sin alerta. Útil para tendencias y monitoreo de señales débiles.",
    "arch.sev.warn.desc":
      "Equipo de cumplimiento notificado. El ticket se abre automáticamente con costo estimado. La respuesta no se bloquea.",
    "arch.sev.crit.desc":
      "La respuesta es interceptada en el gateway antes de llegar al usuario final. Ticket marcado en rojo. Reporte del sintetizador enviado al líder de cumplimiento.",
    "arch.integrity.title": "Log auditable a prueba de manipulación · forense por diseño",
    "arch.integrity.desc":
      "Cada evento que el sistema observa — interacciones, hallazgos, decisiones, cambios de estado de ticket — se anexa a un event store encadenado por SHA-256. La cadena es verificable extremo a extremo en una sola llamada.",
    "arch.int.chain.title": "Cadena de hash",
    "arch.int.chain.desc":
      "Cada registro lleva un hash SHA-256 que combina el hash del registro previo más el nuevo payload. Modificar un evento pasado invalida todos los hashes posteriores.",
    "arch.int.append.title": "Append-only a nivel de aplicación",
    "arch.int.append.desc":
      "La clase <code>EventStore</code> no expone métodos UPDATE ni DELETE. Los cambios de estado de workflow (open → resolved) son ellos mismos nuevos eventos.",
    "arch.int.verify.title": "Verificable en O(n)",
    "arch.int.verify.desc":
      "<code>EventStore.verify_integrity()</code> recalcula la cadena de extremo a extremo. Devuelve false en cualquier inconsistencia. Los reguladores pueden ejecutarlo en una copia de la base de datos.",
    "arch.int.pg.title": "Alternativa Postgres",
    "arch.int.pg.desc":
      "Para despliegues empresariales, un esquema opcional Postgres impone inmutabilidad a nivel de base de datos vía triggers a nivel de fila que previenen UPDATE/DELETE.",
    "arch.stack.title": "Stack tecnológico",
    "arch.stack.desc":
      "Linux-first, ARM64-nativo, asyncio en todas las capas. Diseñado para correr en una sola VM Vultr para PYMES y escalar horizontalmente en Kubernetes para empresas.",
    "arch.stack.inf": "Inferencia",
    "arch.stack.run": "Runtime",
    "arch.stack.persist": "Persistencia",
    "arch.stack.deploy": "Despliegue",
    "arch.stack.front": "Frontend",
    "arch.stack.qa": "Calidad",
    "arch.perf.title": "Envolvente de rendimiento",
    "arch.perf.desc":
      "Medido en la instancia NVIDIA Grace ARM64 productiva, contra endpoints reales de Featherless y Gemini.",
    "arch.perf.p1.lbl": "latencia p95, interacción sin flag",
    "arch.perf.p1.note": "Los pre-filtros regex hacen corto-circuito antes de cualquier llamada LLM.",
    "arch.perf.p2.lbl": "latencia p95, un solo agente dispara",
    "arch.perf.p2.note": "Una llamada Featherless. El sintetizador se dispara solo si hay hallazgos.",
    "arch.perf.p3.lbl": "latencia p95, evento crítico completo",
    "arch.perf.p3.note": "Los cinco agentes disparan en paralelo + sintetizador Gemini.",
    "arch.perf.p4.lbl": "Throughput sostenido, una sola instancia",
    "arch.perf.p4.note": "Semáforo por modelo previene cascadas de 429.",
    "arch.perf.p5.lbl": "Tasa de falso positivo en corpus sintético",
    "arch.perf.p5.note":
      "La regla de consenso en crítico elimina alucinaciones de un solo agente.",
    "arch.perf.p6.lbl": "Tamaño del event store",
    "arch.perf.p6.note": "SQLite con payloads JSON. Indexado por interaction_id, type, time.",
    "arch.sec.title": "Garantías de seguridad",
    "arch.sec.desc":
      "Integrado por defecto; nada opcional. Alineado a OWASP LLM Top 10, listo para SOC 2, y a los controles de cumplimiento del EU AI Act.",
    "arch.sec.secrets.title": "Sin secretos en tránsito ni en reposo",
    "arch.sec.secrets.desc":
      "Las API keys viven en <code>.env</code> fuera de git. Las keys falsas del bot demo vulnerable son hooks explícitos para testing — verificadas deterministamente.",
    "arch.sec.injection.title": "Endurecido contra inyección de prompt",
    "arch.sec.injection.desc":
      "Los system prompts se construyen con separadores explícitos. Cada agente usa salida JSON estructurada. La regex del lado de cumplimiento atrapa fugas de credenciales si un bot downstream se ve comprometido.",
    "arch.sec.auditable.title": "Auditable por reguladores",
    "arch.sec.auditable.desc":
      "Cualquier decisión puede reproducirse deterministamente desde el event store. Los reportes PDF incluyen el hash del evento para verificación de cadena de custodia.",
    "arch.sec.reversible.title": "Bloqueos reversibles por humano",
    "arch.sec.reversible.desc":
      "Una decisión de bloqueo es ella misma un evento registrado. Los operadores pueden anularla (estado: descartado) sin modificar los hallazgos históricos.",
    "arch.topo.title": "Topologías de despliegue",
    "arch.topo.desc":
      "Desde una sola instancia Vultr de 1 vCPU hasta un clúster Kubernetes multi-región.",
    "arch.topo.smb.tier": "PYME / Demo",
    "arch.topo.mid.tier": "Mercado medio",
    "arch.topo.ent.tier": "Empresa",

    // ── tickets ─────────────────────────────────────────────────────────
    "tickets.title": "Tickets de cumplimiento · remediaciones automáticas",
    "tickets.kpi.open": "Tickets abiertos",
    "tickets.kpi.open.sub": "esperando remediación",
    "tickets.kpi.exposure": "Exposición estimada",
    "tickets.kpi.exposure.sub": "multas potenciales si no se remedia",
    "tickets.kpi.resolved": "Resueltos",
    "tickets.kpi.resolved.sub": "cerrados",
    "tickets.kpi.total": "Total tickets",
    "tickets.kpi.total.sub": "histórico completo",
    "tickets.list": "Cola de remediación",
    "tickets.list.desc":
      "Cada advertencia o crítico detectado por SENTRY se vuelve un ticket aquí, con un costo estimado si no se resuelve y una propuesta de corrección.",
    "tickets.filter.all": "Todos",
    "tickets.filter.open": "Abiertos",
    "tickets.filter.in_progress": "En progreso",
    "tickets.filter.resolved": "Resueltos",
    "tickets.filter.dismissed": "Descartados",

    // ── red team (añadido) ──────────────────────────────────────────────
    "rt.hero.eyebrow": "Pen-testing automatizado",
    "rt.hero.title": "Elige un agente · lanza 30 ataques · obtén un score de resiliencia",
    "rt.hero.sub":
      "Haz clic en cualquier agente. SENTRY corre los ataques OWASP LLM Top 10, jailbreaks clásicos (DAN, AIM, abuela), inyección indirecta, pesca de PII, trampas EU AI Act, negación de incidentes DORA e impersonación de autoridad. Devuelve un score 0–100 y los prompts exactos que rompieron al agente.",
    "rt.metric.catalog": "Ataques en catálogo",
    "rt.metric.runtime": "Tiempo típico",
    "rt.metric.categories": "Categorías de ataque",
    "rt.metric.score": "Score de resiliencia",
    "rt.target.title": "Elige un agente objetivo",
    "rt.target.desc":
      "Haz clic en cualquiera de los agentes que SENTRY está auditando. El pen test corre la suite completa contra el agente seleccionado — no requiere API keys para los agentes demo.",
    "rt.target.loading": "Cargando agentes…",
    "rt.custom.summary": "⚙ Usa un agente externo personalizado (avanzado)",
    "rt.custom.provider": "Proveedor",
    "rt.custom.model": "Modelo",
    "rt.custom.key": "API key (no se almacena)",
    "rt.custom.system": "System prompt (opcional)",
    "rt.custom.run": "⚡ Correr pen test contra agente custom",
    "rt.running.title": "Corriendo pen test…",
    "rt.running.sub":
      "Enviando ataques contra el agente seleccionado. Cada uno tarda 1–3 s.",
    "rt.running.init": "Inicializando…",
    "rt.running.complete": "Completo.",
    "rt.results.title": "Resultados",
    "rt.results.score": "Score de resiliencia",
    "rt.results.vulnerable": "✗ VULNERABLE",
    "rt.results.resisted": "✓ Resistió",
    "rt.results.attacker_prompt": "🎯 Prompt del atacante",
    "rt.results.bot_response": "💬 Respuesta del bot (filtrada)",
    "rt.results.attempted": "Prompt intentado",
    "rt.results.run_cta": "⚡ Correr pen test",
    "rt.export.pdf": "📄 Descargar reporte PDF",
    "rt.export.copy": "📋 Copiar resumen al portapapeles",
    "rt.export.share": "🔗 Generar enlace compartible",
  },
  // IT / PT / ZH ship as empty objects → useT() falls back to EN automatically.
  // Adding entries here later upgrades those locales without code changes.
  it: {},
  pt: {},
  zh: {},
};

export const DEFAULT_LANG: Lang = "en";
