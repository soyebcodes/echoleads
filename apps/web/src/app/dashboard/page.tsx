import Link from "next/link";
import { ArrowRight, Activity, Target, Users, Radar, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCampaigns } from "@/app/actions/campaigns";
import { getLeads } from "@/app/actions/leads";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const campaigns = await getCampaigns();
  const leads = await getLeads();

  const totalCampaigns = campaigns.length;
  const totalLeads = leads.length;
  const contactedLeads = leads.filter((l) => l.status === "contacted").length;
  const conversionRate = totalLeads > 0 ? Math.round((contactedLeads / totalLeads) * 100) : 0;

  const stats = [
    { label: "Active campaigns", value: totalCampaigns, icon: Radar, hint: `${totalCampaigns} running` },
    { label: "Total leads", value: totalLeads, icon: Users, hint: `${totalLeads} found` },
    { label: "Contacted", value: contactedLeads, icon: Activity, hint: "engaged with" },
    { label: "Conversion", value: `${conversionRate}%`, icon: TrendingUp, hint: "of leads reached" },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-display text-3xl font-bold tracking-tight">
          Welcome back, {user?.email?.split("@")[0]}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Here's what your Reddit scanner picked up.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <s.icon className="h-4 w-4 text-ember" />
            </div>
            <p className="text-display text-3xl font-bold tracking-tight">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.hint}</p>
          </div>
        ))}
      </div>

      {totalCampaigns === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-ember-soft">
            <Target className="h-6 w-6 text-ember" />
          </div>
          <h2 className="text-display text-xl font-semibold mb-2">No active campaigns yet</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Create your first campaign and EchoLeads will start monitoring Reddit for high-intent leads within minutes.
          </p>
          <Link
            href="/dashboard/campaigns/new"
            className="inline-flex items-center gap-2 rounded-lg bg-ember px-5 py-2.5 text-sm font-semibold text-ember-foreground shadow-ember transition-transform hover:-translate-y-0.5"
          >
            Create campaign <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="text-display text-lg font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-ember" /> Recent leads
            </h2>
            <Link href="/dashboard/leads" className="text-xs font-medium text-ember hover:underline inline-flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {leads.length > 0 ? (
            <ul className="divide-y divide-border">
              {leads.slice(0, 5).map((lead) => (
                <li key={lead.id} className="flex items-center justify-between gap-4 p-4 hover:bg-surface/50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{lead.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      From <span className="text-ember">{lead.campaignName}</span>
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                      lead.status === "new"
                        ? "bg-ember-soft text-ember"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {lead.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No leads found yet. Your worker is scanning…
            </div>
          )}
        </div>
      )}
    </div>
  );
}
