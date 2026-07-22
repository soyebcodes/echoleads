# EchoLeads

**EchoLeads** is an AI-powered lead generation SaaS that automatically discovers high-intent leads from Reddit. It monitors subreddits on a schedule, scores posts using AI, and surfaces the most relevant prospects directly in your dashboard — so you can focus on closing, not searching.

---

## ✨ Features

- 🎯 **Campaign-based Lead Generation** — Create campaigns with keywords, target audience descriptions, and filters to scope your lead search
- 🤖 **AI Relevance Scoring** — Every Reddit post is scored 0–100 by Groq's LLaMA model based on how well it matches your campaign
- 🔄 **Automated Cron Processing** — A Cloudflare Worker runs every 30 minutes to fetch, filter, and score new Reddit posts automatically
- 🚫 **Negative Keyword Filtering** — Exclude irrelevant leads before they ever hit the AI, saving on API costs
- 📊 **Lead Dashboard** — View all discovered leads with their AI scores, Reddit post details, and status tracking
- 🔐 **Auth with Supabase** — Secure sign-up and login, with each user's campaigns and leads fully isolated
- ⚙️ **Settings Page** — Manage your account and preferences

---

## 🏗️ Tech Stack

### Monorepo
| Tool | Purpose |
|------|---------|
| [pnpm Workspaces](https://pnpm.io/workspaces) | Monorepo package manager |
| [TypeScript](https://www.typescriptlang.org/) | Type safety across all packages |

### `apps/web` — Next.js Frontend
| Tool | Purpose |
|------|---------|
| [Next.js 16](https://nextjs.org/) | React framework (App Router) |
| [React 19](https://react.dev/) | UI library |
| [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first styling |
| [shadcn/ui](https://ui.shadcn.com/) | Component library (Radix UI primitives) |
| [Framer Motion](https://www.framer.com/motion/) | Animations |
| [Supabase SSR](https://supabase.com/docs/guides/auth/server-side) | Auth & database client |
| [Drizzle ORM](https://orm.drizzle.team/) | Type-safe database queries |
| [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) | Form handling & validation |
| [Sonner](https://sonner.emilkowal.ski/) | Toast notifications |

### `apps/worker` — Cloudflare Worker (Background Engine)
| Tool | Purpose |
|------|---------|
| [Cloudflare Workers](https://workers.cloudflare.com/) | Serverless edge runtime |
| [Hono](https://hono.dev/) | Lightweight web framework |
| [Wrangler](https://developers.cloudflare.com/workers/wrangler/) | Workers CLI & deployment |
| [Groq API](https://groq.com/) | AI inference (LLaMA 3 8B) |
| [Supabase JS](https://supabase.com/docs/reference/javascript) | Database access from Worker |

### `apps/python-api` — FastAPI Alternative Worker
| Tool | Purpose |
|------|---------|
| [FastAPI](https://fastapi.tiangolo.com/) | Python web framework |
| [BeautifulSoup](https://www.crummy.com/software/BeautifulSoup/bs4/doc/) | RSS feed parsing |
| [psycopg2](https://pypi.org/project/psycopg2/) | PostgreSQL database driver |

### `packages/db` — Shared Database Package
| Tool | Purpose |
|------|---------|
| [Drizzle ORM](https://orm.drizzle.team/) | Schema definition & migrations |
| [PostgreSQL](https://www.postgresql.org/) via Supabase | Database |

---

## 📁 Project Structure

```
echoleads/
├── apps/
│   ├── python-api/            # FastAPI service for alternative Reddit parsing & scoring
│   │   └── main.py            # API logic and database interactions
│   ├── web/                   # Next.js frontend (dashboard, auth, landing)
│   │   └── src/
│   │       ├── app/
│   │       │   ├── (auth)/    # Login / signup pages
│   │       │   ├── dashboard/ # Main app: campaigns, leads, settings
│   │       │   └── page.tsx   # Landing page
│   │       ├── components/    # Shared UI components
│   │       └── lib/           # Utilities, Supabase client
│   │
│   └── worker/                # Cloudflare Worker (cron engine)
│       └── src/
│           └── index.ts       # Scheduled job: fetch Reddit → score → save leads
│
└── packages/
    └── db/                    # Shared Drizzle schema & DB client
        ├── schema.ts          # Table definitions: campaigns, keywords, leads, voiceSamples
        └── drizzle.config.ts  # Drizzle Kit config
```

---

## 🗄️ Database Schema

| Table | Description |
|-------|-------------|
| `profiles` | User profiles linked to Supabase Auth |
| `campaigns` | A user's lead generation campaign with targeting config |
| `keywords` | Positive & negative keywords linked to a campaign |
| `voice_samples` | Sample post/reply pairs to train the AI's voice matching |
| `leads` | Discovered Reddit posts with AI relevance scores & statuses |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [pnpm](https://pnpm.io/) v10+ (`npm install -g pnpm`)
- A [Supabase](https://supabase.com/) project
- A [Groq](https://console.groq.com/) API key
- A [Cloudflare](https://dash.cloudflare.com/) account (for the Worker)

### 1. Clone the repo

```bash
git clone https://github.com/soyebcodes/echoleads.git
cd echoleads
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

#### `apps/web/.env`
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
```

#### `packages/db/.env`
```env
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
```

#### `apps/worker/.dev.vars`
```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GROQ_API_KEY=your-groq-api-key
```

### 4. Run database migrations

```bash
cd packages/db
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

### 5. Run the development servers

**Web app** (Next.js):
```bash
cd apps/web
pnpm dev
# → http://localhost:3000
```

**Worker** (Cloudflare Workers):
```bash
cd apps/worker
pnpm dev
# → http://localhost:8787
```

**Python API** (Alternative FastAPI Backend):
```bash
cd apps/python-api
python -m venv .venv
.venv\Scripts\Activate.ps1 # Or source .venv/bin/activate on Mac/Linux
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
# → http://localhost:8000
```

---

## ⚙️ How the Worker Works

The Cloudflare Worker (`apps/worker`) runs on a **cron schedule every 30 minutes**:

```
Cron Trigger (every 30 min)
       ↓
Fetch all active campaigns from Supabase
       ↓
For each campaign:
  ├── Fetch Reddit RSS feed (r/saas and relevant subreddits)
  ├── Pre-filter posts by negative keywords (fast, free)
  ├── Score remaining posts via Groq AI (LLaMA 3 8B)
  │     → Prompt includes campaign name, description, and target customer
  │     → Returns a score 0–100
  └── Save posts with score ≥ 70 to the `leads` table in Supabase
```

---

## 🌍 Deployment

### Deploy the Web App (Vercel)

```bash
# Push to GitHub, then connect repo to Vercel
# Set env vars in Vercel dashboard under Project Settings → Environment Variables
```

### Deploy the Worker (Cloudflare)

```bash
cd apps/worker

# Set secrets (never store these in wrangler.toml)
wrangler secret put GROQ_API_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY

# Deploy
pnpm deploy
```

### Deploy the Python API (e.g. Render / Railway)

```bash
# Deploys as a standard Python web service using uvicorn
# Set DATABASE_URL in your hosting provider's environment variables
```

---

## 🔐 Security Notes

- **Never commit `.env`, `.env.*`, or `.dev.vars` files** — they are git-ignored
- Cloudflare Worker secrets are managed via `wrangler secret put` and stored encrypted at the edge
- Supabase Row Level Security (RLS) should be enabled to ensure users can only access their own data
- Rotate any API keys immediately if accidentally exposed

---

## 📄 License

ISC © [Soyeb Islam](https://github.com/soyebcodes)
