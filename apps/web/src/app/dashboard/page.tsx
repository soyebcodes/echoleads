import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user?.email?.split('@')[0]}</h1>
        <p className="text-slate-400">Here&apos;s an overview of your lead generation performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Active Campaigns", value: "0", sub: "+0 this week" },
          { label: "Total Leads", value: "0", sub: "+0 today" },
          { label: "Conversion Rate", value: "0%", sub: "Leads matched" },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900/40 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
            <p className="text-slate-400 text-sm font-medium mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-white mb-2">{stat.value}</p>
            <p className="text-xs text-indigo-400/80">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-900/40 backdrop-blur-sm border border-white/5 rounded-2xl p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400">
              <path d="M12 2v20M2 12h20"/>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">No active campaigns</h2>
          <p className="text-slate-400 mb-6">Create your first campaign to start monitoring Reddit for high-intent leads.</p>
          <a
            href="/dashboard/campaigns/new"
            className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl px-6 py-3 transition-colors"
          >
            Create Campaign
          </a>
        </div>
      </div>
    </div>
  );
}
