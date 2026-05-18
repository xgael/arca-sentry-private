# ARCA SENTRY — Web (Next.js)

Frontend del Compliance Operations Center de ARCA SENTRY, migrado desde el dashboard HTML estático servido por FastAPI a Next.js 16 (App Router) + TypeScript + Tailwind v4.

## Stack

- **Next.js 16** — App Router, Server Components donde aplica
- **React 19** + **TypeScript 5**
- **Tailwind CSS v4** — diseño portado desde `style.css` + `polish.css` con tokens semánticos
- **next-intl** — i18n EN/ES portado desde `i18n.js`
- **chart.js + react-chartjs-2** — donut, timeline, regs bar, sparklines
- **lucide-react** — íconos (reemplaza CDN de Lucide)

## Páginas portadas

| Ruta | Origen |
| --- | --- |
| `/` | `dashboard/index.html` + `app.js` |
| `/tickets` | `dashboard/tickets.html` + `tickets.js` |
| `/playground` | `dashboard/playground.html` + `playground.js` |
| `/voice` | `dashboard/voice.html` + `voice.js` |
| `/redteam` | `dashboard/redteam.html` + `redteam.js` |
| `/connect` | `dashboard/connect.html` + `connect.js` |
| `/proxy` | `dashboard/proxy.html` + `proxy.js` |
| `/autofix` | `dashboard/autofix.html` + `autofix.js` |
| `/architecture` | `dashboard/architecture.html` |
| `/agent` | `dashboard/agent.html` + `agent.js` |

## Setup

```bash
cd web
pnpm install        # o npm install
cp .env.example .env.local
pnpm dev            # http://localhost:3000
```

El backend FastAPI sigue siendo la fuente de verdad. Next.js lo consume vía `rewrites` en `next.config.ts` (todo `/api/*` se reescribe a `NEXT_PUBLIC_API_URL`).

## Estructura

```
web/
├── src/
│   ├── app/                  # rutas App Router
│   │   ├── layout.tsx        # topbar + brand line + fuentes
│   │   ├── page.tsx          # dashboard principal
│   │   ├── tickets/page.tsx
│   │   └── ...
│   ├── components/           # piezas reusables
│   │   ├── chrome/           # topbar, brand line, status pill, lang switch
│   │   ├── ui/               # card, kpi, sev-pill, drawer, etc.
│   │   └── charts/           # donut, timeline, regs, spark
│   ├── lib/
│   │   ├── api.ts            # cliente fetch tipado
│   │   ├── format.ts         # animateNumber, escapeHtml, time
│   │   └── i18n.ts           # next-intl config
│   ├── messages/             # en.json, es.json
│   └── styles/
│       └── globals.css       # tokens + base + animations
└── public/
```

## Notas de migración

- El backend FastAPI **no** se tocó. Sigue exponiendo `/health`, `/demo/*`, `/stats/*`, `/reports/*`, etc.
- Para deploy, hay 2 opciones:
  1. **Standalone**: Next.js en Vercel/Node, FastAPI en otro host. Apuntar `NEXT_PUBLIC_API_URL` al backend.
  2. **Detrás de FastAPI**: hacer `next build && next start` y proxy reverso desde la API.
- El dashboard original sigue disponible en `/dashboard/` (FastAPI lo sigue sirviendo). Se puede borrar cuando esta versión esté validada.
