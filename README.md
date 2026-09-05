#  — Clothing Material E-Commerce Website

Customer-facing e-commerce website , built as a
zero-framework, production-grade front end backed by Supabase. Shoppers browse clothing
materials (catalog → category → style → pattern), manage a cart, place orders, and track
order status. Product/price/stock management is handled by a **separate Flutter admin app**
(out of scope for this repository).

> **No payment gateway exists anywhere in this codebase.** Checkout ends at
> **"Place Order"**. Payment collection is handled outside the system.

---

## Tech stack

| Layer      | Choice                                                                 |
| ---------- | ---------------------------------------------------------------------- |
| Front end  | Vanilla **HTML5 + CSS3 + JavaScript (ES6+, native ES modules, async/await)** — NO React/frameworks |
| Tooling    | **Vite 8** — used ONLY as dev server + module bundler + env-var loader |
| Backend    | **Supabase** (Postgres, Auth, Storage) via official `@supabase/supabase-js` v2 |
| Database   | Postgres with Row-Level Security on every table + 1 transactional RPC (`place_order`) |
| Styling    | Exactly **one** global stylesheet (`css/global.css`) driven by CSS custom-property tokens |

## Features

- **Auth** — email/password signup, login, logout; session-aware header & bottom nav
- **Profile + completion gate** — Add-to-Cart / Buy Now / Checkout redirect to profile completion when name/address/phone are missing
- **Catalog browsing** — home page categories + latest materials; listing with pagination (20/page), material multi-select filters, cascading category → style → pattern filters, price range, sort (newest / price ↑ / price ↓), URL-shareable filter state
- **Product detail** — image gallery with lazy thumbnails, stock-capped quantity stepper
- **Cart** — merge-not-duplicate adds, live stock validation, optimistic quantity edits & removals with rollback, header badge sync across pages
- **Checkout** — shipping snapshot review, atomic **Place Order** via `place_order` RPC (order + items + status history + cart clear in ONE transaction)
- **Orders** — paginated order history, detail page with vertical status timeline (`pending → confirmed → processing → shipped → delivered`); order status is **read-only for customers**
- **UX hardening** — skeleton loaders, designed empty states, toasts, debounced inputs, lazy images, 44px tap targets, friendly 404 page, mobile-first at 360px (breakpoints 40rem / 48rem / 64rem)

## Project structure & architecture (layered — do not collapse)

```
dominal-ecommerce-web/
├── index.html                  # Home page (markup only)
├── pages/                      # One .html per screen — markup only, no logic
├── css/
│   └── global.css              # THE ONLY stylesheet; every color/spacing/radius is a token
├── assets/
│   ├── icons/                  # SVG icons only (no emoji in UI)
│   └── images/                 # Placeholders/static imagery
├── js/
│   ├── config/supabaseClient.js# The ONLY createClient call; reads env vars
│   ├── services/               # THE ONLY layer allowed to call Supabase
│   ├── pages/                  # One controller per page (DOM wiring + events)
│   ├── components/             # Reusable render functions (header, cards, gallery…)
│   └── lib/                    # Cross-cutting helpers (toast, guards, debounce, format…)
├── migrations/                 # 0001–0010, run IN ORDER in the Supabase SQL editor
├── docs/                       # Phase QA reports + RLS verification script
├── .env.example                # Template — copy to .env and fill values
└── vite.config.js              # MPA inputs for all 12 pages
```

Rules enforced throughout:

- `js/services/*.js` return `{ ok, data?, error? }` and wrap every call in try/catch
- Controllers/components/libs never import `supabaseClient` directly
- No inline event handlers, no `console.*` in app code, function-level comments
- Design tokens only — exactly one accent color (`--color-accent: #7f1d1d`), white bg, black text

## Prerequisites

- **Node.js ≥ 20.19** and npm 10+
- A **Supabase** project (free tier is fine)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   Windows (CMD):
   ```cmd
   copy .env.example .env
   ```
   macOS/Linux:
   ```bash
   cp .env.example .env
   ```

   Fill in `.env` from **Supabase Dashboard → Project Settings → API**:
   ```
   VITE_SUPABASE_URL=https://<project-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon public key>
   # or, on newer dashboards:
   VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key>
   ```
   Either key name works (`ANON` is tried first, then `PUBLISHABLE`). Both are
   **browser-safe public keys** — they only work because RLS protects the data.
   **Never** put the `service_role` key in this project.

3. **Create the database schema**

   Supabase Dashboard → **SQL Editor** → run each file in `migrations/` **in
   filename order** (`0001` → `0010`). Each can be pasted and run as-is.
   `0010_place_order_rpc.sql` is required for checkout (Place Order).

## Run

```bash
npm run dev        # dev server → http://localhost:5173
```

## Production build

```bash
npm run build      # outputs static site to dist/
npm run preview    # serves the production build → http://localhost:4173
```

`dist/` is fully static — it can be hosted on any static host. (Deployment itself
is out of scope for this build; see "Scope boundaries" below.)

## npm scripts

| Script            | Purpose                                  |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Vite dev server with HMR (port 5173)     |
| `npm run build`   | Production bundle into `dist/`           |
| `npm run preview` | Serve the built `dist/` (port 4173)      |

## Pages (routes)

| Route                            | Screen                        |
| -------------------------------- | ----------------------------- |
| `/` (index.html)                 | Home — categories + latest    |
| `/pages/listing.html`            | Catalog listing + filters     |
| `/pages/product.html?id=…`       | Product detail                |
| `/pages/cart.html`               | Cart                          |
| `/pages/checkout.html`           | Checkout → Place Order        |
| `/pages/order-confirmation.html` | Order placed confirmation     |
| `/pages/orders.html`             | Order history                 |
| `/pages/order-detail.html?id=…`  | Order detail + status timeline|
| `/pages/login.html`              | Login                         |
| `/pages/signup.html`             | Signup                        |
| `/pages/profile.html`            | Profile / completion gate     |
| `/pages/404.html`                | Friendly not-found fallback   |

## Environment & secrets policy

- `.env` is **gitignored**; only `.env.example` (placeholders) is committed.
- Only `VITE_*` variables reach the browser bundle — by Vite design.
- The only values exposed to the browser are the Supabase URL and the
  **anon/publishable public key**. Data security comes from Postgres RLS,
  verified by `docs/rls-verification.sql`.

## Quality assurance docs

- `docs/rls-verification.sql` — run in the SQL editor; prints a full
  pass/fail table proving every RLS policy behaves as specified
- `docs/phase-12-qa-checklist.md` — production-readiness report: env audit,
  smoke test, build verification, acceptance sign-off
- `docs/phase-11-hardening.md` — performance/accessibility/responsiveness audit

## Troubleshooting

| Symptom                                         | Fix                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------- |
| `Missing VITE_SUPABASE_URL…` error on load      | Create `.env` from `.env.example`, fill values, **restart** dev server |
| Stale behavior after pulling new files          | `rmdir /s /q node_modules\.vite` (CMD) / `rm -rf node_modules/.vite`, restart, hard-refresh with `Ctrl+Shift+R` |
| Place Order fails with `function … does not exist` | Run `migrations/0010_place_order_rpc.sql` in the SQL editor      |
| Dev console shows `ws://localhost…` errors      | Vite HMR websocket noise — dev-only, never appears in production builds |

## Scope boundaries (explicit)

- **Deployment** (hosting, domain, SSL, CI/CD) — out of scope; owned outside this build.
- **Legal/compliance content** (privacy policy, terms, returns pages) — out of scope.
- **Admin operations** (product/category/price/stock management, order status
  advancement) — handled by the separate Flutter admin app, using the service key
  server-side. This website only ever runs with the public key.

---

Built phase-by-phase against the client blueprint (Phases 1–12). See `docs/` for
per-phase QA evidence.
