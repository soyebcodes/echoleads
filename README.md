# EchoLeads

**EchoLeads** is an AI-powered lead generation SaaS that automatically discovers high-intent leads from Reddit. It monitors subreddits on a schedule, scores posts using AI, and surfaces the most relevant prospects directly in your dashboard.

---

## ✨ Features

- 🎯 **Campaign-based Lead Generation** — Create campaigns with keywords, target audience descriptions, and filters
- 🤖 **AI Relevance Scoring** — Every Reddit post is scored based on how well it matches your campaign
- 🔄 **Automated Processing** — A Cloudflare Worker runs on schedule to fetch, filter, and score new Reddit posts
- 📊 **Lead Dashboard** — View all discovered leads with AI scores, Reddit post details, and status tracking
- 🔐 **Auth with Supabase** — Secure sign-up and login with isolated user data

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
| [Next.js](https://nextjs.org/) | React framework (App Router) |
| [React](https://react.dev/) | UI library |
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first styling |
| [Framer Motion](https://www.framer.com/motion/) | Animations |
| [Supabase SSR](https://supabase.com/docs/guides/auth/server-side) | Auth & database client |
| [Drizzle ORM](https://orm.drizzle.team/) | Type-safe database queries |
| [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) | Form handling & validation |
| [Sonner](https://sonner.emilkowal.ski/) | Toast notifications |
| [Radix UI](https://www.radix-ui.com/) | Accessible UI components |
| [Lucide React](https://lucide.dev/) | Icon library |

### `apps/worker` — Cloudflare Worker
| Tool | Purpose |
|------|---------|
| [Cloudflare Workers](https://workers.cloudflare.com/) | Serverless edge runtime |
| [Hono](https://hono.dev/) | Lightweight web framework |
| [Wrangler](https://developers.cloudflare.com/workers/wrangler/) | Workers CLI & deployment |
| [Groq API](https://groq.com/) | AI inference |
| [Supabase JS](https://supabase.com/docs/reference/javascript) | Database access from Worker |

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
        ├── schema.ts          # Table definitions: campaigns, keywords, leads
        └── drizzle.config.ts  # Drizzle Kit config
```

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
pnpm db:generate
pnpm db:push
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

---

## ⚙️ How the Worker Works

The Cloudflare Worker (`apps/worker`) runs on a **cron schedule**:

```
Cron Trigger
       ↓
Fetch all active campaigns from Supabase
       ↓
For each campaign:
   ├── Fetch Reddit RSS feed
   ├── Pre-filter posts by negative keywords
   ├── Score remaining posts via Groq AI
   │     → Prompt includes campaign name, description, and target customer
   │     → Returns a score 0–100
   └── Save posts with score ≥ threshold to the `leads` table in Supabase
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

---

## 🔐 Security Notes

- **Never commit `.env`, `.env.*`, or `.dev.vars` files** — they are git-ignored
- Cloudflare Worker secrets are managed via `wrangler secret put` and stored encrypted at the edge
- Supabase Row Level Security (RLS) should be enabled to ensure users can only access their own data
- Rotate any API keys immediately if accidentally exposed

---

## 📄 License

ISC © [Soyeb Islam](https://github.com/soyebcodes)
