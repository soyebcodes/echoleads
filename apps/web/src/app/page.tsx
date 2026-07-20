import Link from "next/link";
import { ArrowRight, Radar, Zap, Target, Sparkles } from "lucide-react";
import { Navbar } from "@/components/navbar";

const FEATURES = [
  { icon: Radar, title: "Real-time scanning", desc: "Monitor thousands of Reddit conversations across every subreddit that matters to you." },
  { icon: Target, title: "Intent scoring", desc: "AI ranks each post by buying intent so you focus on the hottest leads first." },
  { icon: Zap, title: "Instant alerts", desc: "Get notified the second someone asks for what you offer — reply while intent is highest." },
  { icon: Sparkles, title: "Reply drafts", desc: "One-click AI drafts tuned to your voice, ready to post authentically." },
];

const STEPS = [
  { n: "01", title: "Describe your product", body: "Paste your site or write a sentence. We generate keywords, subreddits, and intent signals automatically." },
  { n: "02", title: "We watch Reddit for you", body: "Our scanner runs 24/7, filtering thousands of posts down to the ones that actually look like buyers." },
  { n: "03", title: "You reply and close", body: "Review scored leads, use the AI draft or write your own, and land customers where they're already asking." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="relative pt-36 pb-24 md:pt-48 md:pb-32 px-6 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-grid opacity-40" aria-hidden />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[80%] max-w-4xl -z-10 rounded-full bg-ember/20 blur-[120px]" aria-hidden />

        <div className="container mx-auto max-w-4xl text-center space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 backdrop-blur px-4 py-1.5 text-xs font-medium text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-ember animate-pulse" />
            Now scanning 12,400+ subreddits in real time
          </div>

          <h1 className="text-display text-5xl md:text-7xl font-bold tracking-tighter leading-[1.05]">
            Turn Reddit chatter into{" "}
            <span className="text-ember">pipeline</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            EchoLeads listens across Reddit for people asking for what you sell — and hands you scored, ready-to-reply leads before your competitors even notice.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-ember px-6 py-3 text-sm font-semibold text-ember-foreground shadow-ember transition-transform hover:-translate-y-0.5"
            >
              Start finding leads free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-6 py-3 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
            >
              How it works
            </Link>
          </div>

          <p className="text-xs text-muted-foreground pt-1">Free forever plan • No credit card required</p>
        </div>
      </main>

      <section id="features" className="px-6 py-20 border-t border-border">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <p className="text-display text-xs font-semibold uppercase tracking-[0.2em] text-ember mb-3">What you get</p>
            <h2 className="text-display text-3xl md:text-4xl font-bold tracking-tight">Everything you need to catch buyers in the wild</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-card p-6 shadow-soft transition-transform hover:-translate-y-0.5">
                <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-ember-soft text-ember">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-display text-lg font-semibold mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="px-6 py-20 border-t border-border bg-surface/50">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <p className="text-display text-xs font-semibold uppercase tracking-[0.2em] text-ember mb-3">How it works</p>
            <h2 className="text-display text-3xl md:text-4xl font-bold tracking-tight">From signup to first lead in under 5 minutes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-xl border border-border bg-card p-6">
                <p className="text-display text-3xl font-bold text-ember mb-3">{s.n}</p>
                <h3 className="text-display text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24 border-t border-border">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-display text-3xl md:text-5xl font-bold tracking-tight mb-4">Your next customer is on Reddit right now.</h2>
          <p className="text-lg text-muted-foreground mb-8">Stop scrolling. Let EchoLeads bring the leads to you.</p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-ember px-8 py-3.5 text-base font-semibold text-ember-foreground shadow-ember transition-transform hover:-translate-y-0.5"
          >
            Get started free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="px-6 py-10 border-t border-border">
        <div className="container mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} EchoLeads. Built for founders who close.</p>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-foreground">Sign in</Link>
            <Link href="/signup" className="hover:text-foreground">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
