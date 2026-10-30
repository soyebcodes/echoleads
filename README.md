# EchoLeads

**EchoLeads** is an AI-powered lead generation SaaS that discovers high-intent leads from **Reddit, X (Twitter), and Hacker News**. It scans every platform for your keywords, scores posts with AI (Ollama Cloud, with Groq as automatic fallback), and surfaces ready-to-reply leads in your dashboard — with Stripe subscription billing, plan quotas, and usage metering built in.

---

## ✨ Features

- 🌍 **Multi-platform lead scanning** — Reddit (RSS search), Hacker News (Algolia), and X/Twitter (official API v2 or Apify) in one campaign
- 🤖 **AI intent scoring** — every candidate post is scored 0–100 with a match reason via **Ollama Cloud** (Groq automatic fallback); heuristic keyword scoring keeps scans working even without any AI key
- ✍️ **AI reply drafts** — per-platform drafts (Reddit DM / X reply / HN comment) tuned to your voice samples
- 💳 **Subscription billing** — Stripe Checkout, customer portal, webhook sync, and plan enforcement (Free / Pro / Business)
- 📊 **Usage metering & quotas** — campaigns, monthly leads, and monthly AI replies are metered per plan and enforced server-side
- 📁 **CSV export** — export all leads (or per-campaign) to CSV for your CRM
- 🔐 **Auth with Supabase** — secure sign-up/login with isolated user data and RLS

---

## 🏗️ Tech Stack

| Tool | Purpose |
|------|---------|
| [Next.js 16](https://nextjs.org/) | React framework (App Router, `proxy.ts`, server actions) |
| [Drizzle ORM](https://orm.drizzle.team/) + Postgres (Supabase) | Schema, queries, migrations |
| [Supabase Auth](https://supabase.com/docs/guides/auth/server-side) | Email/password auth with SSR cookies |
| [Stripe](https://stripe.com) | Subscriptions, checkout, customer portal |
| [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser) | Reddit RSS parsing |
| Ollama Cloud / Groq | AI scoring + reply drafting (OpenAI-compatible APIs) |
| Tailwind CSS v4, shadcn-style UI, Framer Motion, Sonner | UI |

> The scanner is now **built into this app** — no separate Python backend required. (v0.1 users: see the migration note below.)

---

## 📁 Project Structure

```
echoleads/
├── src/
│   ├── app/
│   │   ├── (auth)/                  # Login / signup pages
│   │   ├── api/
│   │   │   ├── leads/export/         # CSV export (GET)
│   │   │   └── stripe/webhook/       # Stripe webhook receiver (POST)
│   │   ├── actions/                  # Server actions (auth, campaigns, leads, billing)
│   │   ├── dashboard/                # Overview, campaigns, leads, billing, settings
│   │   ├── page.tsx                  # Landing page (pricing synced with src/lib/billing/plans.ts)
│   │   └── layout.tsx
│   ├── components/                   # Shared UI components
│   └── lib/
│       ├── ai/provider.ts            # Ollama Cloud primary → Groq fallback
│       ├── billing/                  # Plan definitions + usage/limit enforcement
│       ├── db/                       # Drizzle schema & DB client
│       ├── leads-sources/            # reddit.ts, hackernews.ts, x.ts
│       ├── scanner.ts                # Scan orchestration (fetch → filter → score → save)
│       ├── stripe.ts                 # Stripe client + app URL helper
│       └── supabase/                 # Supabase server/client
├── supabase/
│   ├── migration_v02_multi_platform_billing.sql   # Upgrade for v0.1 databases
│   └── ...                           # v0.1 schema SQL files
└── .env.example
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+, pnpm 10+
- A Supabase project
- An [Ollama Cloud](https://ollama.com) API key (primary AI) — a Groq key works as fallback
- Optional: X API bearer token **or** Apify token for X scraping
- Optional: Stripe account for subscriptions

### 1. Install & configure

```bash
pnpm install
cp .env.example .env
```

Fill in your Supabase credentials and AI keys. Everything else is optional:

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URL` | ✅ | Supabase auth + database |
| `OLLAMA_API_KEY` | Recommended | Ollama Cloud AI (primary) — [get a key](https://ollama.com) |
| `OLLAMA_BASE_URL` | No | Defaults to `https://ollama.com/v1` |
| `OLLAMA_MODEL` | No | Defaults to `deepseek-v4.1-flash` |
| `GROQ_API_KEY` | No | Groq fallback if Ollama fails |
| `GROQ_MODEL` | No | Defaults to `openai/gpt-oss-20b` |
| `X_BEARER_TOKEN` | No | X API v2 recent search — enables the X platform (paid X tier required) |
| `APIFY_API_TOKEN` | No | X scraping via Apify — alternative way to enable the X platform |
| `APIFY_X_ACTOR_ID` | No | Defaults to `apido~tweet-scraper` |
| `PYTHON_API_URL` | No | External Python scanner URL — when set, scans are delegated to it |
| `SCANNER_API_KEY` | No | Shared secret sent to the external scanner (`x-api-key`) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | No | Enable subscriptions |
| `STRIPE_PRICE_PRO`, `STRIPE_PRICE_BUSINESS` | No | Pre-created Stripe price IDs (falls back to inline pricing) |
| `NEXT_PUBLIC_APP_URL` | No | App URL for Stripe redirects (defaults to `http://localhost:3000`) |

> **X/Twitter is implemented but gated as "coming soon".** It stays disabled in the campaign UI until either `X_BEARER_TOKEN` (official API — requires a paid X tier, ~$200/mo Basic, since the free tier has no search endpoint) or `APIFY_API_TOKEN` (pay-per-result scraper) is configured. There is no reliable free X search source — Nitter/RSSHub mirrors and logged-in browser automation break constantly and violate X's terms. Reddit and Hacker News work with zero credentials.

### 2. Database

For a **fresh** Supabase project, run the original schema files in `supabase/` (v0.1 SQL), then apply `supabase/migration_v02_multi_platform_billing.sql`, or simply:

```bash
pnpm db:push
```

For an **existing v0.1 deployment** (leads already present), run the migration SQL in the Supabase SQL editor:

```sql
-- supabase/migration_v02_multi_platform_billing.sql
-- Renames leads.reddit_post_id → external_id, adds platform columns,
-- creates subscriptions + usage_monthly with RLS.
```

### 3. Stripe setup (to sell subscriptions)

1. Set `STRIPE_SECRET_KEY` (sk_live… or sk_test…)
2. Create a webhook endpoint in Stripe → `https://your-domain.com/api/stripe/webhook` with events:
   `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
   Copy the signing secret into `STRIPE_WEBHOOK_SECRET`
3. Enable the **Customer Portal** in Stripe (Settings → Billing → Customer portal) so users can manage/cancel
4. Optional: create recurring Prices ($19 Pro / $49 Business) and set `STRIPE_PRICE_PRO` / `STRIPE_PRICE_BUSINESS`. Without them, Checkout uses inline price data automatically.
5. Set `NEXT_PUBLIC_APP_URL` to your production URL

Local webhook testing:

```bash
stripe listen forward --to localhost:3000/api/stripe/webhook
```

### 4. Run

```bash
pnpm dev
# → http://localhost:3000
```

---

## ⚙️ How a Scan Works

Scans run in one of two modes — both write to the same database with the same dedupe and quota rules:

1. **Built-in scanner (default).** Runs inside this Next.js app (`src/lib/scanner.ts`).
2. **Delegated scanner.** If `PYTHON_API_URL` is set, scans are sent to the FastAPI service in [`echoleads-backend`](https://github.com/soyebcodes/echoleads-backend) (`POST /run`), which is useful if you already deploy it on Render/Railway/Fly.

```
Run scan (Run-now button or campaign creation)
        ↓
Load campaign + keywords from the database
        ↓
Fetch posts from each selected platform in parallel
    → Reddit: keyword search over RSS
    → Hacker News: Algolia search (stories + comments)
    → X: official API recent search or Apify scraper
        ↓
Filter: negative keywords out, positive keywords required,
engagement minimums (where the platform provides them)
        ↓
AI scoring via Ollama Cloud (Groq fallback, heuristic fallback)
    → score 0–100 + "why it matched" reason per lead
        ↓
Save leads scoring ≥ 70 to the leads table
    → dedupe per campaign/platform, capped by the plan's
      monthly lead quota
        ↓
Update campaign status (success / failed + error)
```

The Python scanner auto-detects both the v0.1 and v0.2 schema, so you can deploy the frontend and backend in either order.

## 💳 Plans & Quotas

Plans live in `src/lib/billing/plans.ts` (single source of truth for the landing page, billing page, and server-side enforcement):

| Plan | Price | Campaigns | Leads/mo | AI replies/mo | Platforms |
|------|-------|-----------|----------|---------------|-----------|
| Free | $0 | 1 | 50 | 20 | Reddit, Hacker News |
| Pro | $19/mo | 5 | 1,000 | 500 | + X (Twitter) |
| Business | $49/mo | 25 | 5,000 | 2,000 | All |

Quotas are enforced in server actions — `createCampaign` checks the campaign limit, scans cap inserts at the remaining lead quota, and `generateAIResponse` meters AI replies in `usage_monthly`.

---

## 🌍 Deployment (Vercel)

```bash
# Push to GitHub, connect the repo to Vercel, then set all
# environment variables from the table above in the dashboard.
```

Run the SQL migration on your production database before deploying, then point the Stripe webhook at your production URL.

---

## 🔐 Security Notes

- Never commit `.env` or `.env.*` files — they are git-ignored
- Supabase RLS is enabled on all user-owned tables (`profiles`, `subscriptions`, `usage_monthly`); every server action re-verifies ownership by user id
- The Stripe webhook verifies signatures with `STRIPE_WEBHOOK_SECRET`
- The proxy excludes `/api/*` routes so webhooks are never redirected or rate-limited by auth logic

---

## 📄 License

ISC © [Soyeb Islam](https://github.com/soyebcodes)