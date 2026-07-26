# EchoLeads

**EchoLeads** is an AI-powered lead generation SaaS that automatically discovers high-intent leads from Reddit. It monitors subreddits, scores posts using AI, and surfaces the most relevant prospects directly in your dashboard.

---

## ✨ Features

- 🎯 **Campaign-based Lead Generation** — Create campaigns with keywords, target audience descriptions, and filters
- 🤖 **AI Relevance Scoring** — Every Reddit post is scored based on how well it matches your campaign
- 🔄 **On-demand Scanning** — A Python backend fetches, filters, and scores new Reddit posts whenever you scan
- 📊 **Lead Dashboard** — View all discovered leads with AI scores, Reddit post details, and status tracking
- 🔐 **Auth with Supabase** — Secure sign-up and login with isolated user data

---

## 🏗️ Tech Stack

### Frontend — Next.js App
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

### Scanner — EchoLeads Backend (separate repo)
| Tool | Purpose |
|------|---------|
| [FastAPI](https://fastapi.tiangolo.com/) | Python web framework |
| [BeautifulSoup](https://www.crummy.com/software/BeautifulSoup/bs4/doc/) | Reddit RSS feed parsing |
| [Requests](https://docs.python-requests.org/) | HTTP client for Reddit |
| [psycopg2](https://pypi.org/project/psycopg2/) | PostgreSQL database driver |

> The Reddit scanner lives in a **separate repo**: [`echoleads-backend`](https://github.com/soyebcodes/echoleads-backend). This frontend triggers scans by sending `POST /run` to it via `PYTHON_API_URL`.

### Database
| Tool | Purpose |
|------|---------|
| [Drizzle ORM](https://orm.drizzle.team/) | Schema definition & migrations |
| [PostgreSQL](https://www.postgresql.org/) via Supabase | Database |

---

## 📁 Project Structure

```
echoleads/
├── src/
│   ├── app/
│   │   ├── (auth)/            # Login / signup pages
│   │   ├── dashboard/         # Main app: campaigns, leads, settings
│   │   ├── actions/           # Server actions (campaigns, leads, auth, profile)
│   │   ├── layout.tsx
│   │   └── page.tsx           # Landing page
│   ├── components/            # Shared UI components
│   ├── lib/
│   │   ├── db/                # Drizzle schema & DB client
│   │   ├── supabase/          # Supabase server/client
│   │   └── utils.ts
│   └── proxy.ts
├── drizzle.config.ts          # Drizzle Kit config
└── package.json
```

> The Reddit scanner backend is a **separate repo** (`echoleads-backend`), not part of this project tree.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [pnpm](https://pnpm.io/) v10+ (`npm install -g pnpm`)
- A [Supabase](https://supabase.com/) project
- The [`echoleads-backend`](https://github.com/soyebcodes/echoleads-backend) scanner running (see its README for setup)

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

#### `.env`
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
PYTHON_API_URL=http://localhost:8000
```

### 4. Run database migrations

```bash
pnpm db:generate
pnpm db:push
```

### 5. Run the development server

```bash
pnpm dev
# → http://localhost:3000
```

> Scanning requires the [`echoleads-backend`](https://github.com/soyebcodes/echoleads-backend) service to be running. Set `PYTHON_API_URL` (in `.env`) to point at it — `http://localhost:8000` for local dev, or your deployed backend URL.

---

## ⚙️ How the Scanner Works

The scanner ([`echoleads-backend`](https://github.com/soyebcodes/echoleads-backend)) powers on-demand lead scanning. This web app
triggers a scan whenever you create a campaign or click **Scan**:

```
Scan trigger (POST /run)
       ↓
Load campaign from the database
       ↓
Fetch Reddit RSS feed using campaign keywords
       ↓
Pre-filter posts by negative keywords
       ↓
Score remaining posts by relevance
   → Returns a score 0–100
       ↓
Save posts with score ≥ 70 to the `leads` table
       ↓
Update campaign status (running → success / failed)
```

---

## 🌍 Deployment

### Deploy the Web App (Vercel)

```bash
# Push to GitHub, then connect repo to Vercel
# Set env vars in Vercel dashboard under Project Settings → Environment Variables
```

### Deploy the Scanner Backend

The scanner is deployed from the separate [`echoleads-backend`](https://github.com/soyebcodes/echoleads-backend) repo (e.g. Render, Railway, Fly.io). See its README for details. After deploying, set `PYTHON_API_URL` here (or on Vercel) to the backend URL.

---

## 🔐 Security Notes

- **Never commit `.env` or `.env.*` files** — they are git-ignored
- Supabase Row Level Security (RLS) should be enabled to ensure users can only access their own data
- Rotate any API keys immediately if accidentally exposed

---

## 📄 License

ISC © [Soyeb Islam](https://github.com/soyebcodes)
